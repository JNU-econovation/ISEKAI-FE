/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismLogDebug, CubismLogWarning } from '../utils/cubismdebug';

/**
 * Key-Value 쌍을 정의하는 클래스
 * csmMap 클래스의 내부 데이터에서 사용합니다.
 */
export class csmPair<_KeyT, _ValT> {
  /**
   * 생성자
   * @param key Key로 설정할 값
   * @param value Value로 설정할 값
   */
  public constructor(key?: _KeyT, value?: _ValT) {
    this.first = key == undefined ? null : key;

    this.second = value == undefined ? null : value;
  }

  public first: _KeyT; // key로 사용할 변수
  public second: _ValT; // value로 사용할 변수
}

/**
 * 맵형
 */
export class csmMap<_KeyT, _ValT> {
  /**
   * 인자 있는 생성자
   * @param size 초기화 시점에 확보할 크기
   */
  public constructor(size?: number) {
    if (size != undefined) {
      if (size < 1) {
        this._keyValues = [];
        this._dummyValue = null;
        this._size = 0;
      } else {
        this._keyValues = new Array(size);
        this._size = size;
      }
    } else {
      this._keyValues = [];
      this._dummyValue = null;
      this._size = 0;
    }
  }

  /**
   * 소멸자
   */
  public release() {
    this.clear();
  }

  /**
   * 키를 추가합니다.
   * @param key 새로 추가할 키
   */
  public appendKey(key: _KeyT): void {
    let findIndex = -1;
    for (let i = 0; i < this._size; i++) {
      if (this._keyValues[i].first == key) {
        findIndex = i;
        break;
      }
    }

    // 동일한 key가 이미 생성된 경우 아무것도 하지 않음
    if (findIndex != -1) {
      CubismLogWarning('The key `{0}` is already append.', key);
      return;
    }

    // 새로운 Key/Value 쌍을 만듭니다.
    this.prepareCapacity(this._size + 1, false); // 하나 이상 들어갈 공간을 만듭니다.
    // 새로운 key/value의 인덱스는 _size

    this._keyValues[this._size] = new csmPair<_KeyT, _ValT>(key);
    this._size += 1;
  }

  /**
   * 첨자 연산자[key] 오버로드(get)
   * @param key 첨자로 특정되는 Value 값
   */
  public getValue(key: _KeyT): _ValT {
    let found = -1;

    for (let i = 0; i < this._size; i++) {
      if (this._keyValues[i].first == key) {
        found = i;
        break;
      }
    }

    if (found >= 0) {
      return this._keyValues[found].second;
    } else {
      this.appendKey(key); // 새 키 추가
      return this._keyValues[this._size - 1].second;
    }
  }

  /**
   * 첨자 연산자[key] 오버로드(set)
   * @param key 첨자로 특정되는 Value 값
   * @param value 대입할 Value 값
   */
  public setValue(key: _KeyT, value: _ValT): void {
    let found = -1;

    for (let i = 0; i < this._size; i++) {
      if (this._keyValues[i].first == key) {
        found = i;
        break;
      }
    }

    if (found >= 0) {
      this._keyValues[found].second = value;
    } else {
      this.appendKey(key); // 새 키 추가
      this._keyValues[this._size - 1].second = value;
    }
  }

  /**
   * 인자로 전달된 Key를 가진 요소가 존재하는지 여부
   * @param key 존재를 확인할 key
   * @return true 인자로 전달된 key를 가진 요소가 존재함
   * @return false 인자로 전달된 key를 가진 요소가 존재하지 않음
   */
  public isExist(key: _KeyT): boolean {
    for (let i = 0; i < this._size; i++) {
      if (this._keyValues[i].first == key) {
        return true;
      }
    }
    return false;
  }

  /**
   * keyValue 포인터를 모두 해제합니다.
   */
  public clear(): void {
    this._keyValues = void 0;
    this._keyValues = null;
    this._keyValues = [];

    this._size = 0;
  }

  /**
   * 컨테이너의 크기를 가져옵니다.
   *
   * @return 컨테이너의 크기
   */
  public getSize(): number {
    return this._size;
  }

  /**
   * 컨테이너의 용량을 확보합니다.
   * @param newSize 새로운 용량. 인자의 값이 현재 크기 미만인 경우 아무것도 하지 않습니다.
   * @param fitToSize true인 경우 지정한 크기에 맞춥니다. false인 경우 크기를 2배로 확보합니다.
   */
  public prepareCapacity(newSize: number, fitToSize: boolean): void {
    if (newSize > this._keyValues.length) {
      if (this._keyValues.length == 0) {
        if (!fitToSize && newSize < csmMap.DefaultSize)
          newSize = csmMap.DefaultSize;
        this._keyValues.length = newSize;
      } else {
        if (!fitToSize && newSize < this._keyValues.length * 2)
          newSize = this._keyValues.length * 2;
        this._keyValues.length = newSize;
      }
    }
  }

  /**
   * 컨테이너의 첫 요소를 반환합니다.
   */
  public begin(): iterator<_KeyT, _ValT> {
    const ite: iterator<_KeyT, _ValT> = new iterator<_KeyT, _ValT>(this, 0);
    return ite;
  }

  /**
   * 컨테이너의 끝 요소를 반환합니다.
   */
  public end(): iterator<_KeyT, _ValT> {
    const ite: iterator<_KeyT, _ValT> = new iterator<_KeyT, _ValT>(
      this,
      this._size
    ); // 종료
    return ite;
  }

  /**
   * 컨테이너에서 요소를 삭제합니다.
   *
   * @param ite 삭제할 요소
   */
  public erase(ite: iterator<_KeyT, _ValT>): iterator<_KeyT, _ValT> {
    const index: number = ite._index;
    if (index < 0 || this._size <= index) {
      return ite; // 삭제 범위 밖
    }

    // 삭제
    this._keyValues.splice(index, 1);
    --this._size;

    const ite2: iterator<_KeyT, _ValT> = new iterator<_KeyT, _ValT>(
      this,
      index
    ); // 종료
    return ite2;
  }

  /**
   * 컨테이너 값을 32비트 부호 있는 정수형으로 덤프합니다.
   */
  public dumpAsInt() {
    for (let i = 0; i < this._size; i++) {
      CubismLogDebug('{0} ,', this._keyValues[i]);
      CubismLogDebug('\n');
    }
  }

  public static readonly DefaultSize = 10; // 컨테이너 초기화의 기본 크기
  public _keyValues: csmPair<_KeyT, _ValT>[]; // key-value 쌍의 배열
  public _dummyValue: _ValT; // 빈 값을 반환하기 위한 더미
  public _size: number; // 컨테이너의 요소 수
}

/**
 * csmMap<T>의 이터레이터
 */
export class iterator<_KeyT, _ValT> {
  /**
   * 생성자
   */
  constructor(v?: csmMap<_KeyT, _ValT>, idx?: number) {
    this._map = v != undefined ? v : new csmMap<_KeyT, _ValT>();

    this._index = idx != undefined ? idx : 0;
  }

  /**
   * = 연산자 오버로드
   */
  public set(ite: iterator<_KeyT, _ValT>): iterator<_KeyT, _ValT> {
    this._index = ite._index;
    this._map = ite._map;
    return this;
  }

  /**
   * 전위 ++ 연산자 오버로드
   */
  public preIncrement(): iterator<_KeyT, _ValT> {
    ++this._index;
    return this;
  }

  /**
   * 전위 -- 연산자 오버로드
   */
  public preDecrement(): iterator<_KeyT, _ValT> {
    --this._index;
    return this;
  }

  /**
   * 후위 ++ 연산자 오버로드
   */
  public increment(): iterator<_KeyT, _ValT> {
    const iteold = new iterator<_KeyT, _ValT>(this._map, this._index++); // 이전 값 저장
    return iteold;
  }

  /**
   * 후위 -- 연산자 오버로드
   */
  public decrement(): iterator<_KeyT, _ValT> {
    const iteold = new iterator<_KeyT, _ValT>(this._map, this._index); // 이전 값 저장
    this._map = iteold._map;
    this._index = iteold._index;
    return this;
  }

  /**
   * * 연산자 오버로드
   */
  public ptr(): csmPair<_KeyT, _ValT> {
    return this._map._keyValues[this._index];
  }

  /**
   * != 연산
   */
  public notEqual(ite: iterator<_KeyT, _ValT>): boolean {
    return this._index != ite._index || this._map != ite._map;
  }

  _index: number; // 컨테이너의 인덱스 값
  _map: csmMap<_KeyT, _ValT>; // 컨테이너
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './csmmap';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const csmMap = $.csmMap;
  export type csmMap<K, V> = $.csmMap<K, V>;
  export const csmPair = $.csmPair;
  export type csmPair<K, V> = $.csmPair<K, V>;
  export const iterator = $.iterator;
  export type iterator<K, V> = $.iterator<K, V>;
}