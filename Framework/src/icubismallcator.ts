/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

/**
 * 메모리 할당을 추상화한 클래스
 *
 * 메모리 할당·해제 처리를 플랫폼 측에서 구현하여
 * 프레임워크에서 호출하기 위한 인터페이스
 */
export abstract class ICubismAllocator {
  /**
   * 정렬 제약 없는 힙 메모리를 할당합니다
   *
   * @param size 할당할 바이트 수
   * @return 성공하면 할당된 메모리의 주소. 그렇지 않으면 '0'을 반환
   */
  public abstract allocate(size: number): any;

  /**
   * 정렬 제약 없는 힙 메모리를 해제합니다.
   *
   * @param memory 해제할 메모리의 주소
   */
  public abstract deallocate(memory: any): void;

  /**
   * 정렬 제약 있는 힙 메모리를 할당합니다.
   * @param size 할당할 바이트 수
   * @param alignment 메모리 블록의 정렬 폭
   * @return 성공하면 할당된 메모리의 주소. 그렇지 않으면 '0'을 반환
   */
  public abstract allocateAligned(size: number, alignment: number): any;

  /**
   * 정렬 제약 있는 힙 메모리를 해제합니다.
   * @param alignedMemory 해제할 메모리의 주소
   */
  public abstract deallocateAligned(alignedMemory: any): void;
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './icubismallcator';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const ICubismAllocator = $.ICubismAllocator;
  export type ICubismAllocator = $.ICubismAllocator;
}