/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import {
  JsonArray,
  JsonBoolean,
  JsonFloat,
  JsonMap,
  JsonNullvalue,
  JsonString,
  Value
} from './cubismjson';

/**
 * CubismJson에 구현된 Json 파서를 사용하지 않고,
 * TypeScript 표준 Json 파서 등을 사용하여 출력된 결과를
 * Cubism SDK에 정의된 JSON 요소로
 * 대체하는 처리를 하는 클래스.
 */
export class CubismJsonExtension {
  static parseJsonObject(obj: Value, map: JsonMap) {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] == 'boolean') {
        const convValue = Boolean(obj[key]);
        map.put(key, new JsonBoolean(convValue));
      } else if (typeof obj[key] == 'string') {
        const convValue = String(obj[key]);
        map.put(key, new JsonString(convValue));
      } else if (typeof obj[key] == 'number') {
        const convValue = Number(obj[key]);
        map.put(key, new JsonFloat(convValue));
      } else if (obj[key] instanceof Array) {
        // HACK: Array를 단독으로 변환할 수 없으므로 unknown으로 변경한 후 Value로 지정하고 있습니다.
        map.put(
          key,
          CubismJsonExtension.parseJsonArray(obj[key] as unknown as Value)
        );
      } else if (obj[key] instanceof Object) {
        map.put(
          key,
          CubismJsonExtension.parseJsonObject(obj[key], new JsonMap())
        );
      } else if (obj[key] == null) {
        map.put(key, new JsonNullvalue());
      } else {
        // 어느 것에도 해당하지 않는 경우에도 처리합니다.
        map.put(key, obj[key]);
      }
    });
    return map;
  }

  protected static parseJsonArray(obj: Value) {
    const arr = new JsonArray();
    Object.keys(obj).forEach(key => {
      const convKey = Number(key);
      if (typeof convKey == 'number') {
        if (typeof obj[key] == 'boolean') {
          const convValue = Boolean(obj[key]);
          arr.add(new JsonBoolean(convValue));
        } else if (typeof obj[key] == 'string') {
          const convValue = String(obj[key]);
          arr.add(new JsonString(convValue));
        } else if (typeof obj[key] == 'number') {
          const convValue = Number(obj[key]);
          arr.add(new JsonFloat(convValue));
        } else if (obj[key] instanceof Array) {
          // HACK: Array를 단독으로 변환할 수 없으므로 unknown으로 변경한 후 Value로 지정하고 있습니다.
          arr.add(this.parseJsonArray(obj[key] as unknown as Value));
        } else if (obj[key] instanceof Object) {
          arr.add(this.parseJsonObject(obj[key], new JsonMap()));
        } else if (obj[key] == null) {
          arr.add(new JsonNullvalue());
        } else {
          // 어느 것에도 해당하지 않는 경우에도 처리합니다.
          arr.add(obj[key]);
        }
      } else if (obj[key] instanceof Array) {
        // HACK: Array를 단독으로 변환할 수 없으므로 unknown으로 변경한 후 Value로 지정하고 있습니다.
        arr.add(this.parseJsonArray(obj[key] as unknown as Value));
      } else if (obj[key] instanceof Object) {
        arr.add(this.parseJsonObject(obj[key], new JsonMap()));
      } else if (obj[key] == null) {
        arr.add(new JsonNullvalue());
      } else {
        const convValue = Array(obj[key]);
        // 배열 또는 객체로 판단할 수 없는 경우에도 처리합니다.
        for (let i = 0; i < convValue.length; i++) {
          arr.add(convValue[i]);
        }
      }
    });
    return arr;
  }
}