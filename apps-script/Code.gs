/**
 * TheBox 폼 수신용 Google Apps Script (consultation / busan_holding / koreanlearners 공통 템플릿)
 *
 * ▸ 왜 필요한가
 *   기존 프런트엔드는 fetch(..., { mode: 'no-cors' }) 로 전송해서 서버 응답을 읽지 못했고,
 *   그 결과 Apps Script가 실패해도 화면에는 항상 "신청 완료"가 떴습니다(데이터 유실을 알 수 없음).
 *   새 프런트엔드는 no-cors 를 제거하고 응답 상태(res.ok)를 확인합니다.
 *   그러려면 이 스크립트가 (1) 정상 시 HTTP 200 + JSON 을 반환하고 (2) 오류 시 예외를 던져야 합니다.
 *
 * ▸ 배포 방법 (반드시 프런트엔드 배포 "전"에 먼저 해주세요)
 *   1. 이 코드를 각 폼 전용 Apps Script 프로젝트에 붙여넣습니다.
 *   2. SHEET_ID 와 NOTIFY_EMAIL 을 실제 값으로 채웁니다.
 *   3. 배포 > 새 배포 > 유형: 웹 앱 / 실행: 나 / 액세스: "모든 사용자".
 *   4. 생성된 /exec URL 을 프런트엔드 SCRIPT_URL 과 일치시킵니다.
 *   5. 프런트엔드는 Content-Type: text/plain 으로 보냅니다(프리플라이트 회피). 아래 doPost 가 이를 파싱합니다.
 */

const SHEET_ID     = '여기에_구글시트_ID';   // 시트 URL의 /d/ 와 /edit 사이 문자열
const SHEET_NAME   = 'Sheet1';              // 기록할 시트 탭 이름
const NOTIFY_EMAIL = 'busanthebox@gmail.com'; // 신규 신청 알림을 받을 이메일

function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  // 1) 허니팟: 봇이 채우는 숨김 필드가 있으면 조용히 무시(시트에 기록하지 않음)
  if (data.website) {
    return json_({ ok: true, skipped: true });
  }

  // 2) 서버(한국 시간) 기준 타임스탬프로 덮어써 클라이언트 시계 오차를 제거
  const now = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  data['서버수신시간'] = now;

  // 3) 시트에 기록 — 헤더가 없으면 키 순서대로 헤더를 생성, 있으면 헤더에 맞춰 정렬
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const lastCol = sheet.getLastColumn();
  let headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  if (headers.length === 0 || headers.join('') === '') {
    headers = Object.keys(data);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  // 새로 등장한 키는 헤더 끝에 추가
  Object.keys(data).forEach(k => {
    if (headers.indexOf(k) === -1) {
      headers.push(k);
      sheet.getRange(1, headers.length).setValue(k);
    }
  });
  const row = headers.map(h => (h in data ? data[h] : ''));
  sheet.appendRow(row);

  // 4) 신규 신청 이메일 알림(유실 이중 방지)
  try {
    MailApp.sendEmail(
      NOTIFY_EMAIL,
      '[TheBox] 새 신청 접수: ' + (data['이름'] || data.name || ''),
      headers.map(h => h + ': ' + (h in data ? data[h] : '')).join('\n')
    );
  } catch (mailErr) {
    // 메일 실패는 기록 자체를 막지 않음
  }

  return json_({ ok: true });
}

function doGet() {
  return json_({ ok: true, status: 'alive' });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
