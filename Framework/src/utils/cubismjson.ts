/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { strtod } from '../live2dcubismframework';
import { csmMap, iterator as csmMap_iterator } from '../type/csmmap';
import { csmString } from '../type/csmstring';
import { csmVector, iterator as csmVector_iterator } from '../type/csmvector';
import { CubismLogInfo } from './cubismdebug';

// StaticInitializeNotForClientCall()에서 초기화합니다.
const CSM_JSON_ERROR_TYPE_MISMATCH = 'Error: type mismatch';
const CSM_JSON_ERROR_INDEX_OF_BOUNDS = 'Error: index out of bounds';

/**
 * 파싱된 JSON 요소의 기본 클래스입니다.
 */
export abstract class Value {
  /**
   * 생성자
   */
  public constructor() {}

  /**
   * 요소를 문자열 형식(csmString)으로 반환합니다.
   */
  public abstract getString(defaultValue?: string, indent?: string): string;

  /**
   * 요소를 문자열 형식(string)으로 반환합니다.
   */
  public getRawString(defaultValue?: string, indent?: string): string {
    return this.getString(defaultValue, indent);
  }

  /**
   * 요소를 숫자 형식(number)으로 반환합니다.
   */
  public toInt(defaultValue = 0): number {
    return defaultValue;
  }

  /**
   * 요소를 숫자 형식(number)으로 반환합니다.
   */
  public toFloat(defaultValue = 0): number {
    return defaultValue;
  }

  /**
   * 요소를 불리언 형식(boolean)으로 반환합니다.
   */
  public toBoolean(defaultValue = false): boolean {
    return defaultValue;
  }

  /**
   * 크기를 반환합니다.
   */
  public getSize(): number {
    return 0;
  }

  /**
   * 요소를 배열(Value[])로 반환합니다.
   */
  public getArray(defaultValue: Value[] = null): Value[] {
    return defaultValue;
  }

  /**
   * 요소를 컨테이너(array)로 반환합니다.
   */
  public getVector(defaultValue = new csmVector<Value>()): csmVector<Value> {
    return defaultValue;
  }

  /**
   * 요소를 맵(csmMap<csmString, Value>)으로 반환합니다.
   */
  public getMap(defaultValue?: csmMap<string, Value>): csmMap<string, Value> {
    return defaultValue;
  }

  /**
   * 첨자 연산자[index]
   */
  public getValueByIndex(index: number): Value {
    return Value.errorValue.setErrorNotForClientCall(
      CSM_JSON_ERROR_TYPE_MISMATCH
    );
  }

  /**
   * 첨자 연산자[string | csmString]
   */
  public getValueByString(s: string | csmString): Value {
    return Value.nullValue.setErrorNotForClientCall(
      CSM_JSON_ERROR_TYPE_MISMATCH
    );
  }

  /**
   * 맵의 키 목록을 컨테이너로 반환합니다.
   *
   * @return 맵의 키 목록
   */
  public getKeys(): csmVector<string> {
    return Value.dummyKeys;
  }

  /**
   * Value의 종류가 오류 값이면 true
   */
  public isError(): boolean {
    return false;
  }

  /**
   * Value의 종류가 null이면 true
   */
  public isNull(): boolean {
    return false;
  }

  /**
   * Value의 종류가 불리언이면 true
   */
  public isBool(): boolean {
    return false;
  }

  /**
   * Value의 종류가 숫자 형식이면 true
   */
  public isFloat(): boolean {
    return false;
  }

  /**
   * Value의 종류가 문자열이면 true
   */
  public isString(): boolean {
    return false;
  }

  /**
   * Value의 종류가 배열이면 true
   */
  public isArray(): boolean {
    return false;
  }

  /**
   * Value의 종류가 맵 형식이면 true
   */
  public isMap(): boolean {
    return false;
  }

  /**
   * 인자 값과 같으면 true
   */
  public equals(value: csmString): boolean;
  public equals(value: string): boolean;
  public equals(value: number): boolean;
  public equals(value: boolean): boolean;
  public equals(value: any): boolean {
    return false;
  }

  /**
   * Value 값이 정적이면 true, 정적이면 해제하지 않습니다.
   */
  public isStatic(): boolean {
    return false;
  }

  /**
   * Value에 오류 값을 설정합니다.
   */
  public setErrorNotForClientCall(errorStr: string): Value {
    return JsonError.errorValue;
  }

  /**
   * 초기화용 메소드
   */
  public static staticInitializeNotForClientCall(): void {
    JsonBoolean.trueValue = new JsonBoolean(true);
    JsonBoolean.falseValue = new JsonBoolean(false);
    Value.errorValue = new JsonError('ERROR', true);
    Value.nullValue = new JsonNullvalue();
    Value.dummyKeys = new csmVector<string>();
  }

  /**
   * 해제용 메소드
   */
  public static staticReleaseNotForClientCall(): void {
    JsonBoolean.trueValue = null;
    JsonBoolean.falseValue = null;
    Value.errorValue = null;
    Value.nullValue = null;
    Value.dummyKeys = null;
  }

  protected _stringBuffer: string; // 문자열 버퍼

  private static dummyKeys: csmVector<string>; // 더미 키

  public static errorValue: Value; // 임시 반환 값으로 반환되는 오류입니다. CubismFramework::Dispose()할 때까지 삭제하지 마십시오.
  public static nullValue: Value; // 임시 반환 값으로 반환되는 NULL입니다. CubismFramework::Dispose()할 때까지 삭제하지 마십시오.

  [key: string]: any; // 명시적으로 연관 배열을 any 유형으로 지정
}

/**
 * Ascii 문자에만 대응하는 최소한의 경량 JSON 파서입니다.
 * 사양은 JSON의 서브셋입니다.
 * 설정 파일(model3.json) 등의 로드용
 *
 * [미지원 항목]
 * ・일본어 등 비 ASCII 문자
 * ・e를 사용한 지수 표현
 */
export class CubismJson {
  /**
   * 생성자
   */
  public constructor(buffer?: ArrayBuffer, length?: number) {
    this._error = null;
    this._lineCount = 0;
    this._root = null;

    if (buffer != undefined) {
      this.parseBytes(buffer, length, this._parseCallback);
    }
  }

  /**
   * 바이트 데이터에서 직접 로드하여 파싱합니다.
   *
   * @param buffer 버퍼
   * @param size 버퍼 크기
   * @return CubismJson 클래스의 인스턴스. 실패하면 NULL
   */
  public static create(buffer: ArrayBuffer, size: number) {
    const json = new CubismJson();
    const succeeded: boolean = json.parseBytes(
      buffer,
      size,
      json._parseCallback
    );

    if (!succeeded) {
      CubismJson.delete(json);
      return null;
    } else {
      return json;
    }
  }

  /**
   * 파싱된 JSON 객체의 해제 처리
   *
   * @param instance CubismJson 클래스의 인스턴스
   */
  public static delete(instance: CubismJson) {
    instance = null;
  }

  /**
   * 파싱된 JSON의 루트 요소를 반환합니다.
   */
  public getRoot(): Value {
    return this._root;
  }

  /**
   *  Unicode 바이너리를 String으로 변환
   *
   * @param buffer 변환할 바이너리 데이터
   * @return 변환 후의 문자열
   */
  public static arrayBufferToString(buffer: ArrayBuffer): string {
    const uint8Array: Uint8Array = new Uint8Array(buffer);
    let str = '';

    for (let i = 0, len: number = uint8Array.length; i < len; ++i) {
      str += '%' + this.pad(uint8Array[i].toString(16));
    }

    str = decodeURIComponent(str);
    return str;
  }

  /**
   * 인코딩, 패딩
   */
  private static pad(n: string): string {
    return n.length < 2 ? '0' + n : n;
  }

  /**
   * JSON 파싱을 실행합니다.
   * @param buffer    파싱 대상 데이터 바이트
   * @param size      데이터 바이트 크기
   * return true : 성공
   * return false: 실패
   */
  public parseBytes(
    buffer: ArrayBuffer,
    size: number,
    parseCallback?: parseJsonObject
  ): boolean {
    const endPos: number[] = new Array<number>(1); // 참조 전달을 위한 배열
    const decodeBuffer: string = CubismJson.arrayBufferToString(buffer);

    if (parseCallback == undefined) {
      this._root = this.parseValue(decodeBuffer, size, 0, endPos);
    } else {
      // TypeScript 표준 JSON 파서 사용
      this._root = parseCallback(JSON.parse(decodeBuffer), new JsonMap());
    }

    if (this._error) {
      let strbuf = '\0';
      strbuf = 'Json parse error : @line ' + (this._lineCount + 1) + '\n';
      this._root = new JsonString(strbuf);

      CubismLogInfo('{0}', this._root.getRawString());
      return false;
    } else if (this._root == null) {
      this._root = new JsonError(new csmString(this._error), false); // root가 해제되므로 오류 객체를 별도로 생성합니다.
      return false;
    }
    return true;
  }

  /**
   * 파싱 시 오류 값을 반환합니다.
   */
  public getParseError(): string {
    return this._error;
  }

  /**
   * 루트 요소 다음 요소가 파일의 끝이면 true를 반환합니다.
   */
  public checkEndOfFile(): boolean {
    return this._root.getArray()[1].equals('EOF');
  }

  /**
   * JSON 요소에서 Value(float,String,Value*,Array,null,true,false)를 파싱합니다.
   * 요소의 서식에 따라 내부에서 ParseString(), ParseObject(), ParseArray()를 호출합니다.
   *
   * @param   buffer      JSON 요소의 버퍼
   * @param   length      파싱할 길이
   * @param   begin       파싱을 시작할 위치
   * @param   outEndPos   파싱 종료 시의 위치
   * @return      파싱에서 가져온 Value 객체
   */
  protected parseValue(
    buffer: string,
    length: number,
    begin: number,
    outEndPos: number[]
  ) {
    if (this._error) return null;

    let o: Value = null;
    let i: number = begin;
    let f: number;

    for (; i < length; i++) {
      const c: string = buffer[i];
      switch (c) {
        case '-':
        case '.':
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9': {
          const afterString: string[] = new Array(1); // 참조 전달용
          f = strtod(buffer.slice(i), afterString);
          outEndPos[0] = buffer.indexOf(afterString[0]);
          return new JsonFloat(f);
        }
        case '"':
          return new JsonString(
            this.parseString(buffer, length, i + 1, outEndPos)
          ); // \" 다음 문자부터
        case '[':
          o = this.parseArray(buffer, length, i + 1, outEndPos);
          return o;
        case '{':
          o = this.parseObject(buffer, length, i + 1, outEndPos);
          return o;
        case 'n': // null 외에는 없음
          if (i + 3 < length) {
            o = new JsonNullvalue(); // 해제할 수 있도록 함
            outEndPos[0] = i + 4;
          } else {
            this._error = 'parse null';
          }
          return o;
        case 't': // true 외에는 없음
          if (i + 3 < length) {
            o = JsonBoolean.trueValue;
            outEndPos[0] = i + 4;
          } else {
            this._error = 'parse true';
          }
          return o;
        case 'f': // false 외에는 없음
          if (i + 4 < length) {
            o = JsonBoolean.falseValue;
            outEndPos[0] = i + 5;
          } else {
            this._error = "illegal ',' position";
          }
          return o;
        case ',': // Array separator
          this._error = "illegal ',' position";
          return null;
        case ']': // 잘못된 }이지만 건너뜁니다. 배열 끝에 불필요한 ,가 있는 것으로 보입니다.
          outEndPos[0] = i; // 같은 문자를 다시 처리
          return null;
        case '\n':
          this._lineCount++;
        // falls through
        case ' ':
        case '\t':
        case '\r':
        default:
          // 건너뛰기
          break;
      }
    }

    this._error = 'illegal end of value';
    return null;
  }

  /**
   * 다음 `"`까지의 문자열을 파싱합니다.
   *
   * @param   string  ->  파싱 대상 문자열
   * @param   length  ->  파싱할 길이
   * @param   begin   ->  파싱을 시작할 위치
   * @param  outEndPos   ->  파싱 종료 시의 위치
   * @return      파싱한 문자열 요소
   */
  protected parseString(
    string: string,
    length: number,
    begin: number,
    outEndPos: number[]
  ): string {
    if (this._error) {
      return null;
    }

    if (!string) {
      this._error = 'string is null';
      return null;
    }

    let i = begin;
    let c: string, c2: string;
    const ret: csmString = new csmString('');
    let bufStart: number = begin; // sbuf에 등록되지 않은 문자의 시작 위치

    for (; i < length; i++) {
      c = string[i];

      switch (c) {
        case '"': {
          // 끝나는 ", 이스케이프 문자는 별도로 처리되므로 여기에 오지 않습니다.
          outEndPos[0] = i + 1; // " 다음 문자
          ret.append(string.slice(bufStart), i - bufStart); // 이전 문자까지 등록
          return ret.s;
        }
        // falls through
        case '//': {
          // 이스케이프의 경우
          i++; // 2문자를 세트로 취급

          if (i - 1 > bufStart) {
            ret.append(string.slice(bufStart), i - bufStart); // 이전 문자까지 등록
          }
          bufStart = i + 1; // 이스케이프(2문자) 다음 문자부터

          if (i < length) {
            c2 = string[i];

            switch (c2) {
              case '\\':
                ret.expansion(1, '\\');
                break;
              case '"':
                ret.expansion(1, '"');
                break;
              case '/':
                ret.expansion(1, '/');
                break;
              case 'b':
                ret.expansion(1, '\b');
                break;
              case 'f':
                ret.expansion(1, '\f');
                break;
              case 'n':
                ret.expansion(1, '\n');
                break;
              case 'r':
                ret.expansion(1, '\r');
                break;
              case 't':
                ret.expansion(1, '\t');
                break;
              case 'u':
                this._error = 'parse string/unicord escape not supported';
                break;
              default:
                break;
            }
          } else {
            this._error = 'parse string/escape error';
          }
        }
        // falls through
        default: {
          break;
        }
      }
    }

    this._error = 'parse string/illegal end';
    return null;
  }

  /**
   * JSON의 객체 요소를 파싱하여 Value 객체를 반환합니다.
   *
   * @param buffer    JSON 요소의 버퍼
   * @param length    파싱할 길이
   * @param begin     파싱을 시작할 위치
   * @param outEndPos 파싱 종료 시의 위치
   * @return 파싱에서 가져온 Value 객체
   */
  protected parseObject(
    buffer: string,
    length: number,
    begin: number,
    outEndPos: number[]
  ): Value {
    if (this._error) {
      return null;
    }

    if (!buffer) {
      this._error = 'buffer is null';
      return null;
    }

    const ret: JsonMap = new JsonMap();

    // Key: Value
    let key = '';
    let i: number = begin;
    let c = '';
    const localRetEndPos2: number[] = Array(1);
    let ok = false;

    // ,가 계속되는 동안 루프
    for (; i < length; i++) {
      FOR_LOOP: for (; i < length; i++) {
        c = buffer[i];

        switch (c) {
          case '"':
            key = this.parseString(buffer, length, i + 1, localRetEndPos2);
            if (this._error) {
              return null;
            }

            i = localRetEndPos2[0];
            ok = true;
            break FOR_LOOP; //-- 루프에서 나감
          case '}': // 닫는 괄호
            outEndPos[0] = i + 1;
            return ret; // 비어 있음
          case ':':
            this._error = "illegal ':' position";
            break;
          case '\n':
            this._lineCount++;
          // falls through
          default:
            break; // 건너뛸 문자
        }
      }
      if (!ok) {
        this._error = 'key not found';
        return null;
      }

      ok = false;

      // : 확인
      FOR_LOOP2: for (; i < length; i++) {
        c = buffer[i];

        switch (c) {
          case ':':
            ok = true;
            i++;
            break FOR_LOOP2;
          case '}':
            this._error = "illegal '}' position";
            break;
          // falls through
          case '\n':
            this._lineCount++;
          // case ' ': case '\t' : case '\r':
          // falls through
          default:
            break; // 건너뛸 문자
        }
      }

      if (!ok) {
        this._error = "':' not found";
        return null;
      }

      // 값 확인
      const value: Value = this.parseValue(buffer, length, i, localRetEndPos2);
      if (this._error) {
        return null;
      }

      i = localRetEndPos2[0];

      // ret.put(key, value);
      ret.put(key, value);

      FOR_LOOP3: for (; i < length; i++) {
        c = buffer[i];

        switch (c) {
          case ',':
            break FOR_LOOP3;
          case '}':
            outEndPos[0] = i + 1;
            return ret; // 정상 종료
          case '\n':
            this._lineCount++;
          // falls through
          default:
            break; // 건너뛰기
        }
      }
    }

    this._error = 'illegal end of perseObject';
    return null;
  }

  /**
   * 다음 `"`까지의 문자열을 파싱합니다.
   * @param buffer    JSON 요소의 버퍼
   * @param length    파싱할 길이
   * @param begin     파싱을 시작할 위치
   * @param outEndPos 파싱 종료 시의 위치
   * @return 파싱에서 가져온 Value 객체
   */
  protected parseArray(
    buffer: string,
    length: number,
    begin: number,
    outEndPos: number[]
  ): Value {
    if (this._error) {
      return null;
    }

    if (!buffer) {
      this._error = 'buffer is null';
      return null;
    }

    let ret: JsonArray = new JsonArray();

    // key : value
    let i: number = begin;
    let c: string;
    const localRetEndpos2: number[] = new Array(1);

    // ,가 계속되는 동안 루프
    for (; i < length; i++) {
      // : 확인
      const value: Value = this.parseValue(buffer, length, i, localRetEndpos2);

      if (this._error) {
        return null;
      }
      i = localRetEndpos2[0];

      if (value) {
        ret.add(value);
      }

      // FOR_LOOP3:
      // boolean breakflag = false;
      FOR_LOOP: for (; i < length; i++) {
        c = buffer[i];

        switch (c) {
          case ',':
            // breakflag = true;
            // break; // 다음 KEY, VAlUE로
            break FOR_LOOP;
          case ']':
            outEndPos[0] = i + 1;
            return ret; // 종료
          case '\n':
            ++this._lineCount;
          //case ' ':
          //case '\t':
          //case '\r':
          // falls through
          default:
            break; // 건너뛰기
        }
      }
    }

    ret = void 0;
    this._error = 'illegal end of parseObject';
    return null;
  }

  _parseCallback: parseJsonObject = CubismJsonExtension.parseJsonObject; // 파싱 시 사용하는 처리의 콜백 함수

  _error: string; // 파싱 시 오류
  _lineCount: number; // 오류 보고에 사용되는 줄 수 카운트
  _root: Value; // 파싱된 루트 요소
}

interface parseJsonObject {
  (obj: Value, map: JsonMap): JsonMap;
}

/**
 * 파싱된 JSON 요소를 float 값으로 취급합니다.
 */
export class JsonFloat extends Value {
  /**
   * 생성자
   */
  constructor(v: number) {
    super();

    this._value = v;
  }

  /**
   * Value의 종류가 숫자 형식이면 true
   */
  public isFloat(): boolean {
    return true;
  }

  /**
   * 요소를 문자열 형식(csmString)으로 반환합니다.
   */
  public getString(defaultValue: string, indent: string): string {
    const strbuf = '\0';
    this._value = parseFloat(strbuf);
    this._stringBuffer = strbuf;

    return this._stringBuffer;
  }

  /**
   * 요소를 숫자 형식(number)으로 반환합니다.
   */
  public toInt(defaultValue = 0): number {
    return parseInt(this._value.toString());
  }

  /**
   * 요소를 숫자 형식(number)으로 반환합니다.
   */
  public toFloat(defaultValue = 0.0): number {
    return this._value;
  }

  /**
   * 인자 값과 같으면 true
   */
  public equals(value: csmString): boolean;
  public equals(value: string): boolean;
  public equals(value: number): boolean;
  public equals(value: boolean): boolean;
  public equals(value: any): boolean {
    if ('number' === typeof value) {
      // int
      if (Math.round(value)) {
        return false;
      }
      // float
      else {
        return value == this._value;
      }
    }
    return false;
  }

  private _value: number; // JSON 요소 값
}

/**
 * 파싱된 JSON 요소를 불리언 값으로 취급합니다.
 */
export class JsonBoolean extends Value {
  /**
   * Value의 종류가 불리언이면 true
   */
  public isBool(): boolean {
    return true;
  }

  /**
   * 요소를 불리언 형식(boolean)으로 반환합니다.
   */
  public toBoolean(defaultValue = false): boolean {
    return this._boolValue;
  }

  /**
   * 요소를 문자열 형식(csmString)으로 반환합니다.
   */
  public getString(defaultValue: string, indent: string): string {
    this._stringBuffer = this._boolValue ? 'true' : 'false';

    return this._stringBuffer;
  }

  /**
   * 인자 값과 같으면 true
   */
  public equals(value: csmString): boolean;
  public equals(value: string): boolean;
  public equals(value: number): boolean;
  public equals(value: boolean): boolean;
  public equals(value: any): boolean {
    if ('boolean' === typeof value) {
      return value == this._boolValue;
    }
    return false;
  }

  /**
   * Value 값이 정적이면 true, 정적이면 해제하지 않습니다.
   */
  public isStatic(): boolean {
    return true;
  }

  /**
   * 인자 있는 생성자
   */
  public constructor(v: boolean) {
    super();

    this._boolValue = v;
  }

  static trueValue: JsonBoolean; // true
  static falseValue: JsonBoolean; // false

  private _boolValue: boolean; // JSON 요소 값
}

/**
 * 파싱된 JSON 요소를 문자열로 취급합니다.
 */
export class JsonString extends Value {
  /**
   * 인자 있는 생성자
   */
  public constructor(s: string);
  public constructor(s: csmString);
  public constructor(s: any) {
    super();

    if ('string' === typeof s) {
      this._stringBuffer = s;
    }

    if (s instanceof csmString) {
      this._stringBuffer = s.s;
    }
  }

  /**
   * Value의 종류가 문자열이면 true
   */
  public isString(): boolean {
    return true;
  }

  /**
   * 요소를 문자열 형식(csmString)으로 반환합니다.
   */
  public getString(defaultValue: string, indent: string): string {
    return this._stringBuffer;
  }

  /**
   * 인자 값과 같으면 true
   */
  public equals(value: csmString): boolean;
  public equals(value: string): boolean;
  public equals(value: number): boolean;
  public equals(value: boolean): boolean;
  public equals(value: any): boolean {
    if ('string' === typeof value) {
      return this._stringBuffer == value;
    }

    if (value instanceof csmString) {
      return this._stringBuffer == value.s;
    }

    return false;
  }
}

/**
 * JSON 파싱 시의 오류 결과. 문자열 형식처럼 동작합니다.
 */
export class JsonError extends JsonString {
  /**
   * Value 값이 정적이면 true, 정적이면 해제하지 않습니다.
   */
  public isStatic(): boolean {
    return this._isStatic;
  }

  /**
   * 오류 정보를 설정합니다.
   */
  public setErrorNotForClientCall(s: string): Value {
    this._stringBuffer = s;
    return this;
  }

  /**
   * 인자 있는 생성자
   */
  public constructor(s: csmString | string, isStatic: boolean) {
    if ('string' === typeof s) {
      super(s);
    } else {
      super(s);
    }
    this._isStatic = isStatic;
  }

  /**
   * Value의 종류가 오류 값이면 true
   */
  public isError(): boolean {
    return true;
  }

  protected _isStatic: boolean; // 정적 Value 여부
}

/**
 * 파싱된 JSON 요소를 NULL 값으로 가집니다.
 */
export class JsonNullvalue extends Value {
  /**
   * Value의 종류가 NULL 값이면 true
   */
  public isNull(): boolean {
    return true;
  }

  /**
   * 요소를 문자열 형식(csmString)으로 반환합니다.
   */
  public getString(defaultValue: string, indent: string): string {
    return this._stringBuffer;
  }

  /**
   * Value 값이 정적이면 true, 정적이면 해제하지 않습니다.
   */
  public isStatic(): boolean {
    return true;
  }

  /**
   * Value에 오류 값을 설정합니다.
   */
  public setErrorNotForClientCall(s: string): Value {
    this._stringBuffer = s;
    return JsonError.nullValue;
  }

  /**
   * 생성자
   */
  public constructor() {
    super();

    this._stringBuffer = 'NullValue';
  }
}

/**
 * 파싱된 JSON 요소를 배열로 가집니다.
 */
export class JsonArray extends Value {
  /**
   * 생성자
   */
  public constructor() {
    super();
    this._array = new csmVector<Value>();
  }

  /**
   * 소멸자 해당 처리
   */
  public release(): void {
    for (
      let ite: csmVector_iterator<Value> = this._array.begin();
      ite.notEqual(this._array.end());
      ite.preIncrement()
    ) {
      let v: Value = ite.ptr();

      if (v && !v.isStatic()) {
        v = void 0;
        v = null;
      }
    }
  }

  /**
   * Value의 종류가 배열이면 true
   */
  public isArray(): boolean {
    return true;
  }

  /**
   * 첨자 연산자[index]
   */
  public getValueByIndex(index: number): Value {
    if (index < 0 || this._array.getSize() <= index) {
      return Value.errorValue.setErrorNotForClientCall(
        CSM_JSON_ERROR_INDEX_OF_BOUNDS
      );
    }

    const v: Value = this._array.at(index);

    if (v == null) {
      return Value.nullValue;
    }

    return v;
  }

  /**
   * 첨자 연산자[string | csmString]
   */
  public getValueByString(s: string | csmString): Value {
    return Value.errorValue.setErrorNotForClientCall(
      CSM_JSON_ERROR_TYPE_MISMATCH
    );
  }

  /**
   * 요소를 문자열 형식(csmString)으로 반환합니다.
   */
  public getString(defaultValue: string, indent: string): string {
    const stringBuffer: string = indent + '[\n';

    for (
      let ite: csmVector_iterator<Value> = this._array.begin();
      ite.notEqual(this._array.end());
      ite.increment()
    ) {
      const v: Value = ite.ptr();
      this._stringBuffer += indent + '' + v.getString(indent + ' ') + '\n';
    }

    this._stringBuffer = stringBuffer + indent + ']\n';

    return this._stringBuffer;
  }

  /**
   * 배열 요소를 추가합니다.
   * @param v 추가할 요소
   */
  public add(v: Value): void {
    this._array.pushBack(v);
  }

  /**
   * 요소를 컨테이너(csmVector<Value>)로 반환합니다.
   */
  public getVector(defaultValue: csmVector<Value> = null): csmVector<Value> {
    return this._array;
  }

  /**
   * 요소 수를 반환합니다.
   */
  public getSize(): number {
    return this._array.getSize();
  }

  private _array: csmVector<Value>; // JSON 요소 값
}

/**
 * 파싱된 JSON 요소를 맵으로 가집니다.
 */
export class JsonMap extends Value {
  /**
   * 생성자
   */
  public constructor() {
    super();
    this._map = new csmMap<string, Value>();
  }

  /**
   * 소멸자 해당 처리
   */
  public release(): void {
    const ite: csmMap_iterator<string, Value> = this._map.begin();

    while (ite.notEqual(this._map.end())) {
      let v: Value = ite.ptr().second;

      if (v && !v.isStatic()) {
        v = void 0;
        v = null;
      }

      ite.preIncrement();
    }
  }

  /**
   * Value의 종류가 맵 형식이면 true
   */
  public isMap(): boolean {
    return true;
  }

  /**
   * 첨자 연산자[string | csmString]
   */
  public getValueByString(s: string | csmString): Value {
    if (s instanceof csmString) {
      const ret: Value = this._map.getValue(s.s);
      if (ret == null) {
        return Value.nullValue;
      }
      return ret;
    }

    for (
      let iter: csmMap_iterator<string, Value> = this._map.begin();
      iter.notEqual(this._map.end());
      iter.preIncrement()
    ) {
      if (iter.ptr().first == s) {
        if (iter.ptr().second == null) {
          return Value.nullValue;
        }
        return iter.ptr().second;
      }
    }

    return Value.nullValue;
  }

  /**
   * 첨자 연산자[index]
   */
  public getValueByIndex(index: number): Value {
    return Value.errorValue.setErrorNotForClientCall(
      CSM_JSON_ERROR_TYPE_MISMATCH
    );
  }

  /**
   * 요소를 문자열 형식(csmString)으로 반환합니다.
   */
  public getString(defaultValue: string, indent: string) {
    this._stringBuffer = indent + '{\n';

    const ite: csmMap_iterator<string, Value> = this._map.begin();
    while (ite.notEqual(this._map.end())) {
      const key = ite.ptr().first;
      const v: Value = ite.ptr().second;

      this._stringBuffer +=
        indent + ' ' + key + ' : ' + v.getString(indent + '   ') + ' \n';
      ite.preIncrement();
    }

    this._stringBuffer += indent + '}\n';

    return this._stringBuffer;
  }

  /**
   * 요소를 Map 형식으로 반환합니다.
   */
  public getMap(defaultValue?: csmMap<string, Value>): csmMap<string, Value> {
    return this._map;
  }

  /**
   * Map에 요소를 추가합니다.
   */
  public put(key: string, v: Value): void {
    this._map.setValue(key, v);
  }

  /**
   * Map에서 키 목록을 가져옵니다.
   */
  public getKeys(): csmVector<string> {
    if (!this._keys) {
      this._keys = new csmVector<string>();

      const ite: csmMap_iterator<string, Value> = this._map.begin();

      while (ite.notEqual(this._map.end())) {
        const key: string = ite.ptr().first;
        this._keys.pushBack(key);
        ite.preIncrement();
      }
    }
    return this._keys;
  }

  /**
   * Map의 요소 수를 가져옵니다.
   */
  public getSize(): number {
    return this._keys.getSize();
  }

  private _map: csmMap<string, Value>; // JSON 요소 값
  private _keys: csmVector<string>; // JSON 요소 값
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismjson';
import { CubismJsonExtension } from './cubismjsonextension';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismJson = $.CubismJson;
  export type CubismJson = $.CubismJson;
  export const JsonArray = $.JsonArray;
  export type JsonArray = $.JsonArray;
  export const JsonBoolean = $.JsonBoolean;
  export type JsonBoolean = $.JsonBoolean;
  export const JsonError = $.JsonError;
  export type JsonError = $.JsonError;
  export const JsonFloat = $.JsonFloat;
  export type JsonFloat = $.JsonFloat;
  export const JsonMap = $.JsonMap;
  export type JsonMap = $.JsonMap;
  export const JsonNullvalue = $.JsonNullvalue;
  export type JsonNullvalue = $.JsonNullvalue;
  export const JsonString = $.JsonString;
  export type JsonString = $.JsonString;
  export const Value = $.Value;
  export type Value = $.Value;
}