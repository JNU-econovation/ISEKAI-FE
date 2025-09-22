/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import {
  CSM_LOG_LEVEL,
  CSM_LOG_LEVEL_DEBUG,
  CSM_LOG_LEVEL_ERROR,
  CSM_LOG_LEVEL_INFO,
  CSM_LOG_LEVEL_VERBOSE,
  CSM_LOG_LEVEL_WARNING
} from '../cubismframeworkconfig';
import { CubismFramework, LogLevel } from '../live2dcubismframework';

export const CubismLogPrint = (level: LogLevel, fmt: string, args: any[]) => {
  CubismDebug.print(level, '[CSM]' + fmt, args);
};

export const CubismLogPrintIn = (level: LogLevel, fmt: string, args: any[]) => {
  CubismLogPrint(level, fmt + '\n', args);
};

export const CSM_ASSERT = (expr: any) => {
  console.assert(expr);
};

export let CubismLogVerbose: (fmt: string, ...args: any[]) => void;
export let CubismLogDebug: (fmt: string, ...args: any[]) => void;
export let CubismLogInfo: (fmt: string, ...args: any[]) => void;
export let CubismLogWarning: (fmt: string, ...args: any[]) => void;
export let CubismLogError: (fmt: string, ...args: any[]) => void;

if (CSM_LOG_LEVEL <= CSM_LOG_LEVEL_VERBOSE) {
  CubismLogVerbose = (fmt: string, ...args: any[]) => {
    CubismLogPrintIn(LogLevel.LogLevel_Verbose, '[V]' + fmt, args);
  };

  CubismLogDebug = (fmt: string, ...args: any[]) => {
    CubismLogPrintIn(LogLevel.LogLevel_Debug, '[D]' + fmt, args);
  };

  CubismLogInfo = (fmt: string, ...args: any[]) => {
    CubismLogPrintIn(LogLevel.LogLevel_Info, '[I]' + fmt, args);
  };

  CubismLogWarning = (fmt: string, ...args: any[]) => {
    CubismLogPrintIn(LogLevel.LogLevel_Warning, '[W]' + fmt, args);
  };

  CubismLogError = (fmt: string, ...args: any[]) => {
    CubismLogPrintIn(LogLevel.LogLevel_Error, '[E]' + fmt, args);
  };
} else if (CSM_LOG_LEVEL == CSM_LOG_LEVEL_DEBUG) {
  CubismLogDebug = (fmt: string, ...args: any[]) => {
    CubismLogPrintIn(LogLevel.LogLevel_Debug, '[D]' + fmt, args);
  };

  CubismLogInfo = (fmt: string, ...args: any[]) => {
    CubismLogPrintIn(LogLevel.LogLevel_Info, '[I]' + fmt, args);
  };

  CubismLogWarning = (fmt: string, ...args: any[]) => {
    CubismLogPrintIn(LogLevel.LogLevel_Warning, '[W]' + fmt, args);
  };

  CubismLogError = (fmt: string, ...args: any[]) => {
    CubismLogPrintIn(LogLevel.LogLevel_Error, '[E]' + fmt, args);
  };
} else if (CSM_LOG_LEVEL == CSM_LOG_LEVEL_INFO) {
  CubismLogInfo = (fmt: string, ...args: any[]) => {
    CubismLogPrintIn(LogLevel.LogLevel_Info, '[I]' + fmt, args);
  };

  CubismLogWarning = (fmt: string, ...args: any[]) => {
    CubismLogPrintIn(LogLevel.LogLevel_Warning, '[W]' + fmt, args);
  };

  CubismLogError = (fmt: string, ...args: any[]) => {
    CubismLogPrintIn(LogLevel.LogLevel_Error, '[E]' + fmt, args);
  };
} else if (CSM_LOG_LEVEL == CSM_LOG_LEVEL_WARNING) {
  CubismLogWarning = (fmt: string, ...args: any[]) => {
    CubismLogPrintIn(LogLevel.LogLevel_Warning, '[W]' + fmt, args);
  };

  CubismLogError = (fmt: string, ...args: any[]) => {
    CubismLogPrintIn(LogLevel.LogLevel_Error, '[E]' + fmt, args);
  };
} else if (CSM_LOG_LEVEL == CSM_LOG_LEVEL_ERROR) {
  CubismLogError = (fmt: string, ...args: any[]) => {
    CubismLogPrintIn(LogLevel.LogLevel_Error, '[E]' + fmt, args);
  };
}

/**
 * 디버깅용 유틸리티 클래스.
 * 로그 출력, 바이트 덤프 등
 */
export class CubismDebug {
  /**
   * 로그를 출력합니다. 첫 번째 인수에 로그 레벨을 설정합니다.
   * CubismFramework.initialize() 시 옵션으로 설정된 로그 출력 레벨보다 낮은 경우 로그를 출력하지 않습니다.
   *
   * @param logLevel 로그 레벨 설정
   * @param format 서식 문자열
   * @param args 가변 인자
   */
  public static print(logLevel: LogLevel, format: string, args?: any[]): void {
    // 옵션으로 설정된 로그 출력 레벨보다 낮은 경우 로그를 출력하지 않습니다.
    if (logLevel < CubismFramework.getLoggingLevel()) {
      return;
    }

    const logPrint: Live2DCubismCore.csmLogFunction =
      CubismFramework.coreLogFunction;

    if (!logPrint) return;

    const buffer: string = format.replace(/\{(\d+)\}/g, (m, k) => {
      return args[k];
    });
    logPrint(buffer);
  }

  /**
   * 데이터에서 지정된 길이만큼 덤프 출력합니다.
   * CubismFramework.initialize() 시 옵션으로 설정된 로그 출력 레벨보다 낮은 경우 로그를 출력하지 않습니다.
   *
   * @param logLevel 로그 레벨 설정
   * @param data 덤프할 데이터
   * @param length 덤프할 길이
   */
  public static dumpBytes(
    logLevel: LogLevel,
    data: Uint8Array,
    length: number
  ): void {
    for (let i = 0; i < length; i++) {
      if (i % 16 == 0 && i > 0) this.print(logLevel, '\n');
      else if (i % 8 == 0 && i > 0) this.print(logLevel, '  ');
      this.print(logLevel, '{0} ', [data[i] & 0xff]);
    }

    this.print(logLevel, '\n');
  }

  /**
   * private 생성자
   */
  private constructor() {}
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismdebug';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismDebug = $.CubismDebug;
  export type CubismDebug = $.CubismDebug;
}