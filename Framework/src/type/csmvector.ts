/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

/**
 * 벡터형 (가변 배열형)
 */
export class csmVector<T> {
  /**
   * 인자 있는 생성자
   * @param iniitalCapacity 초기화 후의 용량. 데이터 크기는 _capacity * sizeof(T)
   * @param zeroClear true인 경우 초기화 시 확보한 영역을 0으로 채웁니다.
   */
  constructor(initialCapacity = 0) {
    if (initialCapacity < 1) {
      this._ptr = [];
      this._capacity = 0;
      this._size = 0;
    } else {
      this._ptr = new Array(initialCapacity);
      this._capacity = initialCapacity;
      this._size = 0;
    }
  }

  /**
   * 인덱스로 지정한 요소를 반환합니다.
   */
  public at(index: number): T {
    return this._ptr[index];
  }

  /**
   * 요소를 설정합니다.
   * @param index 요소를 설정할 인덱스
   * @param value 설정할 요소
   */
  public set(index: number, value: T): void {
    this._ptr[index] = value;
  }

  /**
   * 컨테이너를 가져옵니다.
   */
  public get(offset = 0): T[] {
    const ret: T[] = new Array<T>();
    for (let i = offset; i < this._size; i++) {
      ret.push(this._ptr[i]);
    }
    return ret;
  }

  /**
   * pushBack 처리, 컨테이너에 새로운 요소를 추가합니다.
   * @param value PushBack 처리로 추가할 값
   */
  public pushBack(value: T): void {
    if (this._size >= this._capacity) {
      this.prepareCapacity(
        this._capacity == 0 ? csmVector.DefaultSize : this._capacity * 2
      );
    }

    this._ptr[this._size++] = value;
  }

  /**
   * 컨테이너의 모든 요소를 해제합니다.
   */
  public clear(): void {
    this._ptr.length = 0;
    this._size = 0;
  }

  /**
   * 컨테이너의 요소 수를 반환합니다.
   * @return 컨테이너의 요소 수
   */
  public getSize(): number {
    return this._size;
  }

  /**
   * 컨테이너의 모든 요소에 대입 처리를 수행합니다.
   * @param newSize 대입 처리 후의 크기
   * @param value 요소에 대입할 값
   */
  public assign(newSize: number, value: T): void {
    const curSize = this._size;

    if (curSize < newSize) {
      this.prepareCapacity(newSize); // capacity 갱신
    }

    for (let i = 0; i < newSize; i++) {
      this._ptr[i] = value;
    }

    this._size = newSize;
  }

  /**
   * 크기 변경
   */
  public resize(newSize: number, value: T = null): void {
    this.updateSize(newSize, value, true);
  }

  /**
   * 크기 변경
   */
  public updateSize(
    newSize: number,
    value: any = null,
    callPlacementNew = true
  ): void {
    const curSize: number = this._size;

    if (curSize < newSize) {
      this.prepareCapacity(newSize); // capacity 갱신

      if (callPlacementNew) {
        for (let i: number = this._size; i < newSize; i++) {
          if (typeof value == 'function') {
            // new
            this._ptr[i] = JSON.parse(JSON.stringify(new value()));
          } // 프리미티브 타입이므로 값 전달
          else {
            this._ptr[i] = value;
          }
        }
      } else {
        for (let i: number = this._size; i < newSize; i++) {
          this._ptr[i] = value;
        }
      }
    } else {
      // newSize <= this._size
      //---
      const sub = this._size - newSize;
      this._ptr.splice(this._size - sub, sub); // 불필요하므로 폐기
    }
    this._size = newSize;
  }

  /**
   * 컨테이너에 컨테이너 요소를 삽입합니다.
   * @param position 삽입할 위치
   * @param begin 삽입할 컨테이너의 시작 위치
   * @param end 삽입할 컨테이너의 끝 위치
   */
  public insert(
    position: iterator<T>,
    begin: iterator<T>,
    end: iterator<T>
  ): void {
    let dstSi: number = position._index;
    const srcSi: number = begin._index;
    const srcEi: number = end._index;

    const addCount: number = srcEi - srcSi;

    this.prepareCapacity(this._size + addCount);

    // 삽입을 위해 기존 데이터를 시프트하여 공간을 만듭니다.
    const addSize = this._size - dstSi;
    if (addSize > 0) {
      for (let i = 0; i < addSize; i++) {
        this._ptr.splice(dstSi + i, 0, null);
      }
    }

    for (let i: number = srcSi; i < srcEi; i++, dstSi++) {
      this._ptr[dstSi] = begin._vector._ptr[i];
    }

    this._size = this._size + addCount;
  }

  /**
   * 컨테이너에서 인덱스로 지정한 요소를 삭제합니다.
   * @param index 인덱스 값
   * @return true 삭제 실행
   * @return false 삭제 범위 밖
   */
  public remove(index: number): boolean {
    if (index < 0 || this._size <= index) {
      return false; // 삭제 범위 밖
    }

    this._ptr.splice(index, 1);
    --this._size;

    return true;
  }

  /**
   * 컨테이너에서 요소를 삭제하고 다른 요소를 시프트합니다.
   * @param ite 삭제할 요소
   */
  public erase(ite: iterator<T>): iterator<T> {
    const index: number = ite._index;
    if (index < 0 || this._size <= index) {
      return ite; // 삭제 범위 밖
    }

    // 삭제
    this._ptr.splice(index, 1);
    --this._size;

    const ite2: iterator<T> = new iterator<T>(this, index); // 종료
    return ite2;
  }

  /**
   * 컨테이너의 용량을 확보합니다.
   * @param newSize 새로운 용량. 인자의 값이 현재 크기 미만인 경우 아무것도 하지 않습니다.
   */
  public prepareCapacity(newSize: number): void {
    if (newSize > this._capacity) {
      if (this._capacity == 0) {
        this._ptr = new Array(newSize);
        this._capacity = newSize;
      } else {
        this._ptr.length = newSize;
        this._capacity = newSize;
      }
    }
  }

  /**
   * 컨테이너의 첫 요소를 반환합니다.
   */
  public begin(): iterator<T> {
    const ite: iterator<T> =
      this._size == 0 ? this.end() : new iterator<T>(this, 0);
    return ite;
  }

  /**
   * 컨테이너의 끝 요소를 반환합니다.
   */
  public end(): iterator<T> {
    const ite: iterator<T> = new iterator<T>(this, this._size);
    return ite;
  }

  public getOffset(offset: number): csmVector<T> {
    const newVector = new csmVector<T>();
    newVector._ptr = this.get(offset);
    newVector._size = this.get(offset).length;
    newVector._capacity = this.get(offset).length;

    return newVector;
  }

  _ptr: T[]; // 컨테이너의 시작 주소
  _size: number; // 컨테이너의 요소 수
  _capacity: number; // 컨테이너의 용량

  static readonly DefaultSize = 10; // 컨테이너 초기화의 기본 크기
}

export class iterator<T> {
  /**
   * 생성자
   */
  public constructor(v?: csmVector<T>, index?: number) {
    this._vector = v != undefined ? v : null;
    this._index = index != undefined ? index : 0;
  }

  /**
   * 대입
   */
  public set(ite: iterator<T>): iterator<T> {
    this._index = ite._index;
    this._vector = ite._vector;
    return this;
  }

  /**
   * 전위 ++ 연산
   */
  public preIncrement(): iterator<T> {
    ++this._index;
    return this;
  }

  /**
   * 전위 -- 연산
   */
  public preDecrement(): iterator<T> {
    --this._index;
    return this;
  }

  /**
   * 후위 ++ 연산자
   */
  public increment(): iterator<T> {
    const iteold = new iterator<T>(this._vector, this._index++); // 이전 값 저장
    return iteold;
  }

  /**
   * 후위 -- 연산자
   */
  public decrement(): iterator<T> {
    const iteold = new iterator<T>(this._vector, this._index--); // 이전 값 저장
    return iteold;
  }

  /**
   * ptr
   */
  public ptr(): T {
    return this._vector._ptr[this._index];
  }

  /**
   * = 연산자 오버로드
   */
  public substitution(ite: iterator<T>): iterator<T> {
    this._index = ite._index;
    this._vector = ite._vector;
    return this;
  }

  /**
   * != 연산자 오버로드
   */
  public notEqual(ite: iterator<T>): boolean {
    return this._index != ite._index || this._vector != ite._vector;
  }

  _index: number; // 컨테이너의 인덱스 값
  _vector: csmVector<T>; // 컨테이너
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './csmvector';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const csmVector = $.csmVector;
  export type csmVector<T> = $.csmVector<T>;
  export const iterator = $.iterator;
  export type iterator<T> = $.iterator<T>;
}