/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismIdManager } from './id/cubismidmanager';
import { CubismRenderer } from './rendering/cubismrenderer';
import {
  CSM_ASSERT,
  CubismLogInfo,
  CubismLogWarning
} from './utils/cubismdebug';
import { Value } from './utils/cubismjson';

export function strtod(s: string, endPtr: string[]): number {
  let index = 0;
  for (let i = 1; ; i++) {
    const testC: string = s.slice(i - 1, i);

    // 지수·마이너스 가능성이 있으므로 건너뛰기
    if (testC == 'e' || testC == '-' || testC == 'E') {
      continue;
    } // 문자열 범위를 넓혀감

    const test: string = s.substring(0, i);
    const number = Number(test);
    if (isNaN(number)) {
      // 숫자로 인식할 수 없게 되어 종료
      break;
    } // 마지막으로 숫자로 인식된 index를 저장

    index = i;
  }
  let d = parseFloat(s); // 파싱된 숫자

  if (isNaN(d)) {
    // 숫자로 인식할 수 없게 되어 종료
    d = NaN;
  }

  endPtr[0] = s.slice(index); // 뒤따르는 문자열
  return d;
}

// 파일 범위 변수 초기화

let s_isStarted = false;
let s_isInitialized = false;
let s_option: Option = null;
let s_cubismIdManager: CubismIdManager = null;

/**
 * Framework 내에서 사용하는 상수 선언
 */
export const Constant = Object.freeze<Record<string, number>>({
  vertexOffset: 0, // 메쉬 정점의 오프셋 값
  vertexStep: 2 // 메쉬 정점의 스텝 값
});

export function csmDelete<T>(address: T): void {
  if (!address) {
    return;
  }

  address = void 0;
}

/**
 * Live2D Cubism SDK Original Workflow SDK의 진입점
 * 이용 시작 시 CubismFramework.initialize()를 호출하고, CubismFramework.dispose()로 종료합니다.
 */
export class CubismFramework {
  /**
   * Cubism Framework의 API를 사용 가능하게 합니다.
   *  API를 실행하기 전에 반드시 이 함수를 실행해야 합니다.
   *  한 번 준비가 완료된 이후에는 다시 실행해도 내부 처리가 생략됩니다.
   *
   * @param    option      Option 클래스의 인스턴스
   *
   * @return   준비 처리가 완료되면 true가 반환됩니다.
   */
  public static startUp(option: Option = null): boolean {
    if (s_isStarted) {
      CubismLogInfo('CubismFramework.startUp() is already done.');
      return s_isStarted;
    }

    s_option = option;

    if (s_option != null) {
      Live2DCubismCore.Logging.csmSetLogFunction(s_option.logFunction);
    }

    s_isStarted = true;

    // Live2D Cubism Core 버전 정보 표시
    if (s_isStarted) {
      const version: number = Live2DCubismCore.Version.csmGetVersion();
      const major: number = (version & 0xff000000) >> 24;
      const minor: number = (version & 0x00ff0000) >> 16;
      const patch: number = version & 0x0000ffff;
      const versionNumber: number = version;

      CubismLogInfo(
        `Live2D Cubism Core version: {0}.{1}.{2} ({3})`,
        ('00' + major).slice(-2),
        ('00' + minor).slice(-2),
        ('0000' + patch).slice(-4),
        versionNumber
      );
    }

    CubismLogInfo('CubismFramework.startUp() is complete.');

    return s_isStarted;
  }

  /**
   * StartUp()으로 초기화한 CubismFramework의 각 파라미터를 지웁니다.
   * Dispose()한 CubismFramework를 재사용할 때 이용하십시오.
   */
  public static cleanUp(): void {
    s_isStarted = false;
    s_isInitialized = false;
    s_option = null;
    s_cubismIdManager = null;
  }

  /**
   * Cubism Framework 내의 리소스를 초기화하여 모델을 표시 가능한 상태로 만듭니다。<br>
   *     다시 Initialize()하려면 먼저 Dispose()를 실행해야 합니다.
   *
   * @param memorySize 초기화 시 메모리 양 [byte(s)]
   *    여러 모델을 표시할 때 모델이 업데이트되지 않는 경우 사용하십시오.
   *    지정 시 반드시 1024*1024*16 byte(16MB) 이상의 값을 지정하십시오.
   *    그 외에는 모두 1024*1024*16 byte로 반올림합니다.
   */
  public static initialize(memorySize = 0): void {
    CSM_ASSERT(s_isStarted);
    if (!s_isStarted) {
      CubismLogWarning('CubismFramework is not started.');
      return;
    }

    // --- s_isInitialized에 의한 연속 초기화 방지 ---
    // 연속으로 리소스 할당이 일어나지 않도록 합니다.
    // 다시 Initialize()하려면 먼저 Dispose()를 실행해야 합니다.
    if (s_isInitialized) {
      CubismLogWarning(
        'CubismFramework.initialize() skipped, already initialized.'
      );
      return;
    }

    //---- static 초기화 ----
    Value.staticInitializeNotForClientCall();

    s_cubismIdManager = new CubismIdManager();

    // --- HACK: 초기화 시 메모리 양 확장 (단위 byte) ---
    // 여러 모델을 표시할 때 모델이 업데이트되지 않는 경우 사용하십시오.
    // 지정 시 반드시 1024*1024*16 byte(16MB) 이상의 값을 지정하십시오.
    // 그 외에는 모두 1024*1024*16 byte로 반올림합니다.
    Live2DCubismCore.Memory.initializeAmountOfMemory(memorySize);

    s_isInitialized = true;

    CubismLogInfo('CubismFramework.initialize() is complete.');
  }

  /**
   * Cubism Framework 내의 모든 리소스를 해제합니다.
   *      단, 외부에서 할당된 리소스는 해제하지 않습니다.
   *      외부에서 적절하게 파기해야 합니다.
   */
  public static dispose(): void {
    CSM_ASSERT(s_isStarted);
    if (!s_isStarted) {
      CubismLogWarning('CubismFramework is not started.');
      return;
    }

    // --- s_isInitialized에 의한 미초기화 해제 방지 ---
    // dispose()하려면 먼저 initialize()를 실행해야 합니다.
    if (!s_isInitialized) {
      // false...리소스 미확보의 경우
      CubismLogWarning('CubismFramework.dispose() skipped, not initialized.');
      return;
    }

    Value.staticReleaseNotForClientCall();

    s_cubismIdManager.release();
    s_cubismIdManager = null;

    // 렌더러의 정적 리소스(셰이더 프로그램 등)를 해제합니다.
    CubismRenderer.staticRelease();

    s_isInitialized = false;

    CubismLogInfo('CubismFramework.dispose() is complete.');
  }

  /**
   * Cubism Framework의 API를 사용할 준비가 완료되었는지 여부
   * @return API를 사용할 준비가 완료되었으면 true가 반환됩니다.
   */
  public static isStarted(): boolean {
    return s_isStarted;
  }

  /**
   * Cubism Framework의 리소스 초기화가 이미 수행되었는지 여부
   * @return 리소스 할당이 완료되었으면 true가 반환됩니다.
   */
  public static isInitialized(): boolean {
    return s_isInitialized;
  }

  /**
   * Core API에 바인딩된 로그 함수를 실행합니다.
   *
   * @praram message 로그 메시지
   */
  public static coreLogFunction(message: string): void {
    // Return if logging not possible.
    if (!Live2DCubismCore.Logging.csmGetLogFunction()) {
      return;
    }

    Live2DCubismCore.Logging.csmGetLogFunction()(message);
  }

  /**
   * 현재 로그 출력 레벨 설정 값을 반환합니다.
   *
   * @return  현재 로그 출력 레벨 설정 값
   */
  public static getLoggingLevel(): LogLevel {
    if (s_option != null) {
      return s_option.loggingLevel;
    }
    return LogLevel.LogLevel_Off;
  }

  /**
   * ID 관리자 인스턴스 가져오기
   * @return CubismManager 클래스의 인스턴스
   */
  public static getIdManager(): CubismIdManager {
    return s_cubismIdManager;
  }

  /**
   * 정적 클래스로 사용
   * 인스턴스화하지 않음
   */
  private constructor() {}
}

export class Option {
  logFunction: Live2DCubismCore.csmLogFunction; // 로그 출력 함수 객체
  loggingLevel: LogLevel; // 로그 출력 레벨 설정
}

/**
 * 로그 출력 레벨
 */
export enum LogLevel {
  LogLevel_Verbose = 0, // 상세 로그
  LogLevel_Debug, // 디버그 로그
  LogLevel_Info, // 정보 로그
  LogLevel_Warning, // 경고 로그
  LogLevel_Error, // 오류 로그
  LogLevel_Off // 로그 출력 비활성화
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './live2dcubismframework';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const Constant = $.Constant;
  export const csmDelete = $.csmDelete;
  export const CubismFramework = $.CubismFramework;
  export type CubismFramework = $.CubismFramework;
}