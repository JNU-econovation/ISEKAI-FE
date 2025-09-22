/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

//========================================================
//  로그 출력 함수 설정
//========================================================

//---------- 로그 출력 레벨 선택 항목 정의 ----------
// 상세 로그 출력 설정
export const CSM_LOG_LEVEL_VERBOSE = 0;
// 디버그 로그 출력 설정
export const CSM_LOG_LEVEL_DEBUG = 1;
// 정보 로그 출력 설정
export const CSM_LOG_LEVEL_INFO = 2;
// 경고 로그 출력 설정
export const CSM_LOG_LEVEL_WARNING = 3;
// 오류 로그 출력 설정
export const CSM_LOG_LEVEL_ERROR = 4;
// 로그 출력 끄기 설정
export const CSM_LOG_LEVEL_OFF = 5;

/**
 * 로그 출력 레벨 설정.
 *
 * 강제로 로그 출력 레벨을 변경할 때 정의를 활성화합니다.
 * CSM_LOG_LEVEL_VERBOSE ~ CSM_LOG_LEVEL_OFF를 선택합니다.
 */
export const CSM_LOG_LEVEL: number = CSM_LOG_LEVEL_VERBOSE;