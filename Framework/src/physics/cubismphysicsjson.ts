/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismIdHandle } from '../id/cubismid';
import { CubismFramework } from '../live2dcubismframework';
import { CubismVector2 } from '../math/cubismvector2';
import { CubismJson } from '../utils/cubismjson';

// JSON 키
const Position = 'Position';
const X = 'X';
const Y = 'Y';
const Angle = 'Angle';
const Type = 'Type';
const Id = 'Id';

// Meta
const Meta = 'Meta';
const EffectiveForces = 'EffectiveForces';
const TotalInputCount = 'TotalInputCount';
const TotalOutputCount = 'TotalOutputCount';
const PhysicsSettingCount = 'PhysicsSettingCount';
const Gravity = 'Gravity';
const Wind = 'Wind';
const VertexCount = 'VertexCount';
const Fps = 'Fps';

// PhysicsSettings
const PhysicsSettings = 'PhysicsSettings';
const Normalization = 'Normalization';
const Minimum = 'Minimum';
const Maximum = 'Maximum';
const Default = 'Default';
const Reflect = 'Reflect';
const Weight = 'Weight';

// Input
const Input = 'Input';
const Source = 'Source';

// Output
const Output = 'Output';
const Scale = 'Scale';
const VertexIndex = 'VertexIndex';
const Destination = 'Destination';

// Particle
const Vertices = 'Vertices';
const Mobility = 'Mobility';
const Delay = 'Delay';
const Radius = 'Radius';
const Acceleration = 'Acceleration';

/**
 * physics3.json의 컨테이너.
 */
export class CubismPhysicsJson {
  /**
   * 생성자
   * @param buffer physics3.json이 로드된 버퍼
   * @param size 버퍼 크기
   */
  public constructor(buffer: ArrayBuffer, size: number) {
    this._json = CubismJson.create(buffer, size);
  }

  /**
   * 소멸자 해당 처리
   */
  public release(): void {
    CubismJson.delete(this._json);
  }

  /**
   * 중력 가져오기
   * @return 중력
   */
  public getGravity(): CubismVector2 {
    const ret: CubismVector2 = new CubismVector2(0, 0);
    ret.x = this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(EffectiveForces)
      .getValueByString(Gravity)
      .getValueByString(X)
      .toFloat();
    ret.y = this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(EffectiveForces)
      .getValueByString(Gravity)
      .getValueByString(Y)
      .toFloat();
    return ret;
  }

  /**
   * 바람 가져오기
   * @return 바람
   */
  public getWind(): CubismVector2 {
    const ret: CubismVector2 = new CubismVector2(0, 0);
    ret.x = this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(EffectiveForces)
      .getValueByString(Wind)
      .getValueByString(X)
      .toFloat();
    ret.y = this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(EffectiveForces)
      .getValueByString(Wind)
      .getValueByString(Y)
      .toFloat();
    return ret;
  }

  /**
   * 물리 연산 설정 FPS 가져오기
   * @return 물리 연산 설정 FPS
   */
  public getFps(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(Fps)
      .toFloat(0.0);
  }

  /**
   * 물리점 관리 개수 가져오기
   * @return 물리점 관리 개수
   */
  public getSubRigCount(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(PhysicsSettingCount)
      .toInt();
  }

  /**
   * 입력 총합계 가져오기
   * @return 입력 총합계
   */
  public getTotalInputCount(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(TotalInputCount)
      .toInt();
  }

  /**
   * 출력 총합계 가져오기
   * @return 출력 총합계
   */
  public getTotalOutputCount(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(TotalOutputCount)
      .toInt();
  }

  /**
   * 물리점 개수 가져오기
   * @return 물리점 개수
   */
  public getVertexCount(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(VertexCount)
      .toInt();
  }

  /**
   * 정규화된 위치의 최소값 가져오기
   * @param physicsSettingIndex 물리 연산 설정의 인덱스
   * @return 정규화된 위치의 최소값
   */
  public getNormalizationPositionMinimumValue(
    physicsSettingIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Normalization)
      .getValueByString(Position)
      .getValueByString(Minimum)
      .toFloat();
  }

  /**
   * 정규화된 위치의 최대값 가져오기
   * @param physicsSettingIndex 물리 연산 설정의 인덱스
   * @return 정규화된 위치의 최대값
   */
  public getNormalizationPositionMaximumValue(
    physicsSettingIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Normalization)
      .getValueByString(Position)
      .getValueByString(Maximum)
      .toFloat();
  }

  /**
   * 정규화된 위치의 기본값 가져오기
   * @param physicsSettingIndex 물리 연산 설정의 인덱스
   * @return 정규화된 위치의 기본값
   */
  public getNormalizationPositionDefaultValue(
    physicsSettingIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Normalization)
      .getValueByString(Position)
      .getValueByString(Default)
      .toFloat();
  }

  /**
   * 정규화된 각도의 최소값 가져오기
   * @param physicsSettingIndex 물리 연산 설정의 인덱스
   * @return 정규화된 각도의 최소값
   */
  public getNormalizationAngleMinimumValue(
    physicsSettingIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Normalization)
      .getValueByString(Angle)
      .getValueByString(Minimum)
      .toFloat();
  }

  /**
   * 정규화된 각도의 최대값 가져오기
   * @param physicsSettingIndex
   * @return 정규화된 각도의 최대값
   */
  public getNormalizationAngleMaximumValue(
    physicsSettingIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Normalization)
      .getValueByString(Angle)
      .getValueByString(Maximum)
      .toFloat();
  }

  /**
   * 정규화된 각도의 기본값 가져오기
   * @param physicsSettingIndex 물리 연산 설정의 인덱스
   * @return 정규화된 각도의 기본값
   */
  public getNormalizationAngleDefaultValue(
    physicsSettingIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Normalization)
      .getValueByString(Angle)
      .getValueByString(Default)
      .toFloat();
  }

  /**
   * 입력 개수 가져오기
   * @param physicsSettingIndex 물리 연산 설정의 인덱스
   * @return 입력 개수
   */
  public getInputCount(physicsSettingIndex: number): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Input)
      .getVector()
      .getSize();
  }

  /**
   * 입력 가중치 가져오기
   * @param physicsSettingIndex 물리 연산 설정의 인덱스
   * @param inputIndex 입력의 인덱스
   * @return 입력 가중치
   */
  public getInputWeight(
    physicsSettingIndex: number,
    inputIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Input)
      .getValueByIndex(inputIndex)
      .getValueByString(Weight)
      .toFloat();
  }

  /**
   * 입력 반전 가져오기
   * @param physicsSettingIndex 물리 연산 설정의 인덱스
   * @param inputIndex 입력의 인덱스
   * @return 입력 반전
   */
  public getInputReflect(
    physicsSettingIndex: number,
    inputIndex: number
  ): boolean {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Input)
      .getValueByIndex(inputIndex)
      .getValueByString(Reflect)
      .toBoolean();
  }

  /**
   * 입력 종류 가져오기
   * @param physicsSettingIndex 물리 연산 설정의 인덱스
   * @param inputIndex 입력의 인덱스
   * @return 입력 종류
   */
  public getInputType(physicsSettingIndex: number, inputIndex: number): string {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Input)
      .getValueByIndex(inputIndex)
      .getValueByString(Type)
      .getRawString();
  }

  /**
   * 입력 소스 ID 가져오기
   * @param physicsSettingIndex 물리 연산 설정의 인덱스
   * @param inputIndex 입력의 인덱스
   * @return 입력 소스 ID
   */
  public getInputSourceId(
    physicsSettingIndex: number,
    inputIndex: number
  ): CubismIdHandle {
    return CubismFramework.getIdManager().getId(
      this._json
        .getRoot()
        .getValueByString(PhysicsSettings)
        .getValueByIndex(physicsSettingIndex)
        .getValueByString(Input)
        .getValueByIndex(inputIndex)
        .getValueByString(Source)
        .getValueByString(Id)
        .getRawString()
    );
  }

  /**
   * 출력 개수 가져오기
   * @param physicsSettingIndex 물리 연산 설정의 인덱스
   * @return 출력 개수
   */
  public getOutputCount(physicsSettingIndex: number): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Output)
      .getVector()
      .getSize();
  }

  /**
   * 출력 물리점의 인덱스 가져오기
   * @param physicsSettingIndex 물리 연산 설정의 인덱스
   * @param outputIndex 출력의 인덱스
   * @return 출력 물리점의 인덱스
   */
  public getOutputVertexIndex(
    physicsSettingIndex: number,
    outputIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Output)
      .getValueByIndex(outputIndex)
      .getValueByString(VertexIndex)
      .toInt();
  }

  /**
   * 출력 각도의 스케일을 가져옵니다.
   * @param physicsSettingIndex 물리 연산 설정의 인덱스
   * @param outputIndex 출력의 인덱스
   * @return 출력 각도의 스케일
   */
  public getOutputAngleScale(
    physicsSettingIndex: number,
    outputIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Output)
      .getValueByIndex(outputIndex)
      .getValueByString(Scale)
      .toFloat();
  }

  /**
   * 출력 가중치 가져오기
   * @param physicsSettingIndex 물리 연산 설정의 인덱스
   * @param outputIndex 출력의 인덱스
   * @return 출력 가중치
   */
  public getOutputWeight(
    physicsSettingIndex: number,
    outputIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Output)
      .getValueByIndex(outputIndex)
      .getValueByString(Weight)
      .toFloat();
  }

  /**
   * 출력 대상 ID 가져오기
   * @param physicsSettingIndex 물리 연산 설정의 인덱스
   * @param outputIndex 출력의 인덱스
   * @return 출력 대상 ID
   */
  public getOutputDestinationId(
    physicsSettingIndex: number,
    outputIndex: number
  ): CubismIdHandle {
    return CubismFramework.getIdManager().getId(
      this._json
        .getRoot()
        .getValueByString(PhysicsSettings)
        .getValueByIndex(physicsSettingIndex)
        .getValueByString(Output)
        .getValueByIndex(outputIndex)
        .getValueByString(Destination)
        .getValueByString(Id)
        .getRawString()
    );
  }

  /**
   * 출력 종류 가져오기
   * @param physicsSettingIndex 물리 연산 설정의 인덱스
   * @param outputIndex 출력의 인덱스
   * @return 출력 종류
   */
  public getOutputType(
    physicsSettingIndex: number,
    outputIndex: number
  ): string {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Output)
      .getValueByIndex(outputIndex)
      .getValueByString(Type)
      .getRawString();
  }

  /**
   * 출력 반전 가져오기
   * @param physicsSettingIndex 물리 연산의 인덱스
   * @param outputIndex 출력의 인덱스
   * @return 출력 반전
   */
  public getOutputReflect(
    physicsSettingIndex: number,
    outputIndex: number
  ): boolean {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Output)
      .getValueByIndex(outputIndex)
      .getValueByString(Reflect)
      .toBoolean();
  }

  /**
   * 물리점 개수 가져오기
   * @param physicsSettingIndex 물리 연산 설정의 인덱스
   * @return 물리점 개수
   */
  public getParticleCount(physicsSettingIndex: number): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Vertices)
      .getVector()
      .getSize();
  }

  /**
   * 물리점의 움직임 용이성 가져오기
   * @param physicsSettingIndex 물리 연산 설정의 인덱스
   * @param vertexIndex 물리점의 인덱스
   * @return 물리점의 움직임 용이성
   */
  public getParticleMobility(
    physicsSettingIndex: number,
    vertexIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Vertices)
      .getValueByIndex(vertexIndex)
      .getValueByString(Mobility)
      .toFloat();
  }

  /**
   * 물리점의 지연 가져오기
   * @param physicsSettingIndex 물리 연산 설정의 인덱스
   * @param vertexIndex 물리점의 인덱스
   * @return 물리점의 지연
   */
  public getParticleDelay(
    physicsSettingIndex: number,
    vertexIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Vertices)
      .getValueByIndex(vertexIndex)
      .getValueByString(Delay)
      .toFloat();
  }

  /**
   * 물리점의 가속도 가져오기
   * @param physicsSettingIndex 물리 연산 설정
   * @param vertexIndex 물리점의 인덱스
   * @return 물리점의 가속도
   */
  public getParticleAcceleration(
    physicsSettingIndex: number,
    vertexIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Vertices)
      .getValueByIndex(vertexIndex)
      .getValueByString(Acceleration)
      .toFloat();
  }

  /**
   * 물리점의 거리 가져오기
   * @param physicsSettingIndex 물리 연산 설정의 인덱스
   * @param vertexIndex 물리점의 인덱스
   * @return 물리점의 거리
   */
  public getParticleRadius(
    physicsSettingIndex: number,
    vertexIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Vertices)
      .getValueByIndex(vertexIndex)
      .getValueByString(Radius)
      .toFloat();
  }

  /**
   * 물리점의 위치 가져오기
   * @param physicsSettingIndex 물리 연산 설정의 인덱스
   * @param vertexInde 물리점의 인덱스
   * @return 물리점의 위치
   */
  public getParticlePosition(
    physicsSettingIndex: number,
    vertexIndex: number
  ): CubismVector2 {
    const ret: CubismVector2 = new CubismVector2(0, 0);
    ret.x = this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Vertices)
      .getValueByIndex(vertexIndex)
      .getValueByString(Position)
      .getValueByString(X)
      .toFloat();
    ret.y = this._json
      .getRoot()
      .getValueByString(PhysicsSettings)
      .getValueByIndex(physicsSettingIndex)
      .getValueByString(Vertices)
      .getValueByIndex(vertexIndex)
      .getValueByString(Position)
      .getValueByString(Y)
      .toFloat();
    return ret;
  }

  _json: CubismJson; // physics3.json 데이터
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismphysicsjson';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismPhysicsJson = $.CubismPhysicsJson;
  export type CubismPhysicsJson = $.CubismPhysicsJson;
}