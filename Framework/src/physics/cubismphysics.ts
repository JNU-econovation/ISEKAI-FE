/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismMath } from '../math/cubismmath';
import { CubismVector2 } from '../math/cubismvector2';
import { csmVector } from '../type/csmvector';
import { CubismModel } from '../model/cubismmodel';
import {
  CubismPhysicsInput,
  CubismPhysicsNormalization,
  CubismPhysicsOutput,
  CubismPhysicsParticle,
  CubismPhysicsRig,
  CubismPhysicsSource,
  CubismPhysicsSubRig,
  CubismPhysicsTargetType
} from './cubismphysicsinternal';
import { CubismPhysicsJson } from './cubismphysicsjson';

// 물리 타입 태그.
const PhysicsTypeTagX = 'X';
const PhysicsTypeTagY = 'Y';
const PhysicsTypeTagAngle = 'Angle';

// 공기 저항 상수.
const AirResistance = 5.0;

// 입출력 비율의 최대 가중치 상수.
const MaximumWeight = 100.0;

// 이동 임계값 상수.
const MovementThreshold = 0.001;

// 허용되는 최대 델타 시간 상수
const MaxDeltaTime = 5.0;

/**
 * 물리 연산 클래스
 */
export class CubismPhysics {
  /**
   * 인스턴스 생성
   * @param buffer    physics3.json이 로드된 버퍼
   * @param size      버퍼의 크기
   * @return 생성된 인스턴스
   */
  public static create(buffer: ArrayBuffer, size: number): CubismPhysics {
    const ret: CubismPhysics = new CubismPhysics();

    ret.parse(buffer, size);
    ret._physicsRig.gravity.y = 0;

    return ret;
  }

  /**
   * 인스턴스를 파기합니다.
   * @param physics 파기할 인스턴스
   */
  public static delete(physics: CubismPhysics): void {
    if (physics != null) {
      physics.release();
      physics = null;
    }
  }

  /**
   * physics3.json을 파싱합니다.
   * @param physicsJson physics3.json이 로드된 버퍼
   * @param size 버퍼의 크기
   */
  public parse(physicsJson: ArrayBuffer, size: number): void {
    this._physicsRig = new CubismPhysicsRig();

    let json: CubismPhysicsJson = new CubismPhysicsJson(physicsJson, size);

    this._physicsRig.gravity = json.getGravity();
    this._physicsRig.wind = json.getWind();
    this._physicsRig.subRigCount = json.getSubRigCount();

    this._physicsRig.fps = json.getFps();

    this._physicsRig.settings.updateSize(
      this._physicsRig.subRigCount,
      CubismPhysicsSubRig,
      true
    );
    this._physicsRig.inputs.updateSize(
      json.getTotalInputCount(),
      CubismPhysicsInput,
      true
    );
    this._physicsRig.outputs.updateSize(
      json.getTotalOutputCount(),
      CubismPhysicsOutput,
      true
    );
    this._physicsRig.particles.updateSize(
      json.getVertexCount(),
      CubismPhysicsParticle,
      true
    );

    this._currentRigOutputs.clear();
    this._previousRigOutputs.clear();

    let inputIndex = 0,
      outputIndex = 0,
      particleIndex = 0;

    for (let i = 0; i < this._physicsRig.settings.getSize(); ++i) {
      this._physicsRig.settings.at(i).normalizationPosition.minimum =
        json.getNormalizationPositionMinimumValue(i);
      this._physicsRig.settings.at(i).normalizationPosition.maximum =
        json.getNormalizationPositionMaximumValue(i);
      this._physicsRig.settings.at(i).normalizationPosition.defalut =
        json.getNormalizationPositionDefaultValue(i);

      this._physicsRig.settings.at(i).normalizationAngle.minimum =
        json.getNormalizationAngleMinimumValue(i);
      this._physicsRig.settings.at(i).normalizationAngle.maximum =
        json.getNormalizationAngleMaximumValue(i);
      this._physicsRig.settings.at(i).normalizationAngle.defalut =
        json.getNormalizationAngleDefaultValue(i);

      // 입력
      this._physicsRig.settings.at(i).inputCount = json.getInputCount(i);
      this._physicsRig.settings.at(i).baseInputIndex = inputIndex;

      for (let j = 0; j < this._physicsRig.settings.at(i).inputCount; ++j) {
        this._physicsRig.inputs.at(inputIndex + j).sourceParameterIndex = -1;
        this._physicsRig.inputs.at(inputIndex + j).weight = json.getInputWeight(
          i,
          j
        );
        this._physicsRig.inputs.at(inputIndex + j).reflect =
          json.getInputReflect(i, j);

        if (json.getInputType(i, j) == PhysicsTypeTagX) {
          this._physicsRig.inputs.at(inputIndex + j).type =
            CubismPhysicsSource.CubismPhysicsSource_X;
          this._physicsRig.inputs.at(
            inputIndex + j
          ).getNormalizedParameterValue =
            getInputTranslationXFromNormalizedParameterValue;
        } else if (json.getInputType(i, j) == PhysicsTypeTagY) {
          this._physicsRig.inputs.at(inputIndex + j).type =
            CubismPhysicsSource.CubismPhysicsSource_Y;
          this._physicsRig.inputs.at(
            inputIndex + j
          ).getNormalizedParameterValue =
            getInputTranslationYFromNormalizedParamterValue;
        } else if (json.getInputType(i, j) == PhysicsTypeTagAngle) {
          this._physicsRig.inputs.at(inputIndex + j).type =
            CubismPhysicsSource.CubismPhysicsSource_Angle;
          this._physicsRig.inputs.at(
            inputIndex + j
          ).getNormalizedParameterValue =
            getInputAngleFromNormalizedParameterValue;
        }

        this._physicsRig.inputs.at(inputIndex + j).source.targetType =
          CubismPhysicsTargetType.CubismPhysicsTargetType_Parameter;
        this._physicsRig.inputs.at(inputIndex + j).source.id =
          json.getInputSourceId(i, j);
      }
      inputIndex += this._physicsRig.settings.at(i).inputCount;

      // 출력
      this._physicsRig.settings.at(i).outputCount = json.getOutputCount(i);
      this._physicsRig.settings.at(i).baseOutputIndex = outputIndex;

      const currentRigOutput = new PhysicsOutput();
      currentRigOutput.outputs.resize(
        this._physicsRig.settings.at(i).outputCount
      );

      const previousRigOutput = new PhysicsOutput();
      previousRigOutput.outputs.resize(
        this._physicsRig.settings.at(i).outputCount
      );

      for (let j = 0; j < this._physicsRig.settings.at(i).outputCount; ++j) {
        // 초기화
        currentRigOutput.outputs.set(j, 0.0);
        previousRigOutput.outputs.set(j, 0.0);

        this._physicsRig.outputs.at(outputIndex + j).destinationParameterIndex =
          -1;
        this._physicsRig.outputs.at(outputIndex + j).vertexIndex =
          json.getOutputVertexIndex(i, j);
        this._physicsRig.outputs.at(outputIndex + j).angleScale =
          json.getOutputAngleScale(i, j);
        this._physicsRig.outputs.at(outputIndex + j).weight =
          json.getOutputWeight(i, j);
        this._physicsRig.outputs.at(outputIndex + j).destination.targetType =
          CubismPhysicsTargetType.CubismPhysicsTargetType_Parameter;

        this._physicsRig.outputs.at(outputIndex + j).destination.id =
          json.getOutputDestinationId(i, j);

        if (json.getOutputType(i, j) == PhysicsTypeTagX) {
          this._physicsRig.outputs.at(outputIndex + j).type =
            CubismPhysicsSource.CubismPhysicsSource_X;
          this._physicsRig.outputs.at(outputIndex + j).getValue =
            getOutputTranslationX;
          this._physicsRig.outputs.at(outputIndex + j).getScale =
            getOutputScaleTranslationX;
        } else if (json.getOutputType(i, j) == PhysicsTypeTagY) {
          this._physicsRig.outputs.at(outputIndex + j).type =
            CubismPhysicsSource.CubismPhysicsSource_Y;
          this._physicsRig.outputs.at(outputIndex + j).getValue =
            getOutputTranslationY;
          this._physicsRig.outputs.at(outputIndex + j).getScale =
            getOutputScaleTranslationY;
        } else if (json.getOutputType(i, j) == PhysicsTypeTagAngle) {
          this._physicsRig.outputs.at(outputIndex + j).type =
            CubismPhysicsSource.CubismPhysicsSource_Angle;
          this._physicsRig.outputs.at(outputIndex + j).getValue =
            getOutputAngle;
          this._physicsRig.outputs.at(outputIndex + j).getScale =
            getOutputScaleAngle;
        }

        this._physicsRig.outputs.at(outputIndex + j).reflect =
          json.getOutputReflect(i, j);
      }

      this._currentRigOutputs.pushBack(currentRigOutput);
      this._previousRigOutputs.pushBack(previousRigOutput);

      outputIndex += this._physicsRig.settings.at(i).outputCount;

      // 파티클
      this._physicsRig.settings.at(i).particleCount = json.getParticleCount(i);
      this._physicsRig.settings.at(i).baseParticleIndex = particleIndex;

      for (let j = 0; j < this._physicsRig.settings.at(i).particleCount; ++j) {
        this._physicsRig.particles.at(particleIndex + j).mobility =
          json.getParticleMobility(i, j);
        this._physicsRig.particles.at(particleIndex + j).delay =
          json.getParticleDelay(i, j);
        this._physicsRig.particles.at(particleIndex + j).acceleration =
          json.getParticleAcceleration(i, j);
        this._physicsRig.particles.at(particleIndex + j).radius =
          json.getParticleRadius(i, j);
        this._physicsRig.particles.at(particleIndex + j).position =
          json.getParticlePosition(i, j);
      }

      particleIndex += this._physicsRig.settings.at(i).particleCount;
    }

    this.initialize();

    json.release();
    json = void 0;
    json = null;
  }

  /**
   * 현재 파라미터 값으로 물리 연산이 안정화되는 상태를 연산합니다.
   * @param model 물리 연산의 결과를 적용할 모델
   */
  public stabilization(model: CubismModel): void {
    let totalAngle: { angle: number };
    let weight: number;
    let radAngle: number;
    let outputValue: number;
    const totalTranslation: CubismVector2 = new CubismVector2();
    let currentSetting: CubismPhysicsSubRig;
    let currentInputs: CubismPhysicsInput[];
    let currentOutputs: CubismPhysicsOutput[];
    let currentParticles: CubismPhysicsParticle[];

    const parameterValues: Float32Array = model.getModel().parameters.values;
    const parameterMaximumValues: Float32Array =
      model.getModel().parameters.maximumValues;
    const parameterMinimumValues: Float32Array =
      model.getModel().parameters.minimumValues;
    const parameterDefaultValues: Float32Array =
      model.getModel().parameters.defaultValues;

    if ((this._parameterCaches?.length ?? 0) < model.getParameterCount()) {
      this._parameterCaches = new Float32Array(model.getParameterCount());
    }

    if ((this._parameterInputCaches?.length ?? 0) < model.getParameterCount()) {
      this._parameterInputCaches = new Float32Array(model.getParameterCount());
    }

    for (let j = 0; j < model.getParameterCount(); ++j) {
      this._parameterCaches[j] = parameterValues[j];
      this._parameterInputCaches[j] = parameterValues[j];
    }

    for (
      let settingIndex = 0;
      settingIndex < this._physicsRig.subRigCount;
      ++settingIndex
    ) {
      totalAngle = { angle: 0.0 };
      totalTranslation.x = 0.0;
      totalTranslation.y = 0.0;
      currentSetting = this._physicsRig.settings.at(settingIndex);
      currentInputs = this._physicsRig.inputs.get(
        currentSetting.baseInputIndex
      );
      currentOutputs = this._physicsRig.outputs.get(
        currentSetting.baseOutputIndex
      );
      currentParticles = this._physicsRig.particles.get(
        currentSetting.baseParticleIndex
      );

      // Load input parameters
      for (let i = 0; i < currentSetting.inputCount; ++i) {
        weight = currentInputs[i].weight / MaximumWeight;

        if (currentInputs[i].sourceParameterIndex == -1) {
          currentInputs[i].sourceParameterIndex = model.getParameterIndex(
            currentInputs[i].source.id
          );
        }

        currentInputs[i].getNormalizedParameterValue(
          totalTranslation,
          totalAngle,
          parameterValues[currentInputs[i].sourceParameterIndex],
          parameterMinimumValues[currentInputs[i].sourceParameterIndex],
          parameterMaximumValues[currentInputs[i].sourceParameterIndex],
          parameterDefaultValues[currentInputs[i].sourceParameterIndex],
          currentSetting.normalizationPosition,
          currentSetting.normalizationAngle,
          currentInputs[i].reflect,
          weight
        );

        this._parameterCaches[currentInputs[i].sourceParameterIndex] =
          parameterValues[currentInputs[i].sourceParameterIndex];
      }

      radAngle = CubismMath.degreesToRadian(-totalAngle.angle);

      totalTranslation.x =
        totalTranslation.x * CubismMath.cos(radAngle) -
        totalTranslation.y * CubismMath.sin(radAngle);
      totalTranslation.y =
        totalTranslation.x * CubismMath.sin(radAngle) +
        totalTranslation.y * CubismMath.cos(radAngle);

      // Calculate particles position.
      updateParticlesForStabilization(
        currentParticles,
        currentSetting.particleCount,
        totalTranslation,
        totalAngle.angle,
        this._options.wind,
        MovementThreshold * currentSetting.normalizationPosition.maximum
      );

      // Update output parameters.
      for (let i = 0; i < currentSetting.outputCount; ++i) {
        const particleIndex = currentOutputs[i].vertexIndex;

        if (currentOutputs[i].destinationParameterIndex == -1) {
          currentOutputs[i].destinationParameterIndex = model.getParameterIndex(
            currentOutputs[i].destination.id
          );
        }

        if (
          particleIndex < 1 ||
          particleIndex >= currentSetting.particleCount
        ) {
          continue;
        }

        let translation: CubismVector2 = new CubismVector2();
        translation = currentParticles[particleIndex].position.substract(
          currentParticles[particleIndex - 1].position
        );

        outputValue = currentOutputs[i].getValue(
          translation,
          currentParticles,
          particleIndex,
          currentOutputs[i].reflect,
          this._options.gravity
        );

        this._currentRigOutputs.at(settingIndex).outputs.set(i, outputValue);
        this._previousRigOutputs.at(settingIndex).outputs.set(i, outputValue);

        const destinationParameterIndex: number =
          currentOutputs[i].destinationParameterIndex;

        const outParameterCaches: Float32Array =
          !Float32Array.prototype.slice && 'subarray' in Float32Array.prototype
            ? JSON.parse(
                JSON.stringify(
                  parameterValues.subarray(destinationParameterIndex)
                )
              ) // 값 전달을 위해 JSON.parse, JSON.stringify
            : parameterValues.slice(destinationParameterIndex);

        updateOutputParameterValue(
          outParameterCaches,
          parameterMinimumValues[destinationParameterIndex],
          parameterMaximumValues[destinationParameterIndex],
          outputValue,
          currentOutputs[i]
        );

        // 값 반영
        for (
          let offset: number = destinationParameterIndex, outParamIndex = 0;
          offset < this._parameterCaches.length;
          offset++, outParamIndex++
        ) {
          parameterValues[offset] = this._parameterCaches[offset] =
            outParameterCaches[outParamIndex];
        }
      }
    }
  }

  /**
   * 물리 연산 평가
   *
   * Pendulum interpolation weights
   *
   * 진자 계산 결과는 저장되고, 파라미터에 대한 출력은 저장된 이전 결과로 보간됩니다.
   * The result of the pendulum calculation is saved and
   * the output to the parameters is interpolated with the saved previous result of the pendulum calculation.
   *
   * 그림으로 나타내면 [1]과 [2]로 보간됩니다.
   * The figure shows the interpolation between [1] and [2].
   *
   * 보간 가중치는 최신 진자 계산 타이밍과 다음 타이밍 사이에서 본 현재 시간으로 결정됩니다.
   * The weight of the interpolation are determined by the current time seen between
   * the latest pendulum calculation timing and the next timing.
   *
   * 그림으로 나타내면 [2]와 [4] 사이에서 본 (3) 위치의 가중치가 됩니다.
   * Figure shows the weight of position (3) as seen between [2] and [4].
   *
   * 해석상 진자 계산 타이밍과 가중치 계산 타이밍이 어긋납니다.
   * As an interpretation, the pendulum calculation and weights are misaligned.
   *
   * physics3.json에 FPS 정보가 없으면 항상 이전 진자 상태로 설정됩니다.
   * If there is no FPS information in physics3.json, it is always set in the previous pendulum state.
   *
   * 이 사양은 보간 범위를 벗어난 것으로 인한 떨림 현상을 방지하기 위한 것입니다.
   * The purpose of this specification is to avoid the quivering appearance caused by deviations from the interpolation range.
   *
   * ------------ time -------------->
   *
   *                 |+++++|------| <- weight
   * ==[1]====#=====[2]---(3)----(4)
   *          ^ output contents
   *
   * 1:_previousRigOutputs
   * 2:_currentRigOutputs
   * 3:_currentRemainTime (now rendering)
   * 4:next particles timing
   * @param model 물리 연산의 결과를 적용할 모델
   * @param deltaTimeSeconds 델타 시간[초]
   */
  public evaluate(model: CubismModel, deltaTimeSeconds: number): void {
    let totalAngle: { angle: number };
    let weight: number;
    let radAngle: number;
    let outputValue: number;
    const totalTranslation: CubismVector2 = new CubismVector2();
    let currentSetting: CubismPhysicsSubRig;
    let currentInputs: CubismPhysicsInput[];
    let currentOutputs: CubismPhysicsOutput[];
    let currentParticles: CubismPhysicsParticle[];

    if (0.0 >= deltaTimeSeconds) {
      return;
    }

    const parameterValues: Float32Array = model.getModel().parameters.values;
    const parameterMaximumValues: Float32Array =
      model.getModel().parameters.maximumValues;
    const parameterMinimumValues: Float32Array =
      model.getModel().parameters.minimumValues;
    const parameterDefaultValues: Float32Array =
      model.getModel().parameters.defaultValues;

    let physicsDeltaTime: number;
    this._currentRemainTime += deltaTimeSeconds;
    if (this._currentRemainTime > MaxDeltaTime) {
      this._currentRemainTime = 0.0;
    }

    if ((this._parameterCaches?.length ?? 0) < model.getParameterCount()) {
      this._parameterCaches = new Float32Array(model.getParameterCount());
    }

    if ((this._parameterInputCaches?.length ?? 0) < model.getParameterCount()) {
      this._parameterInputCaches = new Float32Array(model.getParameterCount());
      for (let j = 0; j < model.getParameterCount(); ++j) {
        this._parameterInputCaches[j] = parameterValues[j];
      }
    }

    if (this._physicsRig.fps > 0.0) {
      physicsDeltaTime = 1.0 / this._physicsRig.fps;
    } else {
      physicsDeltaTime = deltaTimeSeconds;
    }

    while (this._currentRemainTime >= physicsDeltaTime) {
      // copyRigOutputs _currentRigOutputs to _previousRigOutputs
      for (
        let settingIndex = 0;
        settingIndex < this._physicsRig.subRigCount;
        ++settingIndex
      ) {
        currentSetting = this._physicsRig.settings.at(settingIndex);
        currentOutputs = this._physicsRig.outputs.get(
          currentSetting.baseOutputIndex
        );
        for (let i = 0; i < currentSetting.outputCount; ++i) {
          this._previousRigOutputs
            .at(settingIndex)
            .outputs.set(
              i,
              this._currentRigOutputs.at(settingIndex).outputs.at(i)
            );
        }
      }

      // 입력 캐시와 파라미터로 선형 보간하여 UpdateParticles할 타이밍의 입력을 계산합니다.
      // Calculate the input at the timing to UpdateParticles by linear interpolation with the _parameterInputCache and parameterValue.
      // _parameterCache는 그룹 간 값 전파 역할을 하므로 _parameterInputCache와 분리해야 합니다.
      // _parameterCache needs to be separated from _parameterInputCache because of its role in propagating values between groups.
      const inputWeight = physicsDeltaTime / this._currentRemainTime;
      for (let j = 0; j < model.getParameterCount(); ++j) {
        this._parameterCaches[j] =
          this._parameterInputCaches[j] * (1.0 - inputWeight) +
          parameterValues[j] * inputWeight;
        this._parameterInputCaches[j] = this._parameterCaches[j];
      }

      for (
        let settingIndex = 0;
        settingIndex < this._physicsRig.subRigCount;
        ++settingIndex
      ) {
        totalAngle = { angle: 0.0 };
        totalTranslation.x = 0.0;
        totalTranslation.y = 0.0;
        currentSetting = this._physicsRig.settings.at(settingIndex);
        currentInputs = this._physicsRig.inputs.get(
          currentSetting.baseInputIndex
        );
        currentOutputs = this._physicsRig.outputs.get(
          currentSetting.baseOutputIndex
        );
        currentParticles = this._physicsRig.particles.get(
          currentSetting.baseParticleIndex
        );

        // Load input parameters
        for (let i = 0; i < currentSetting.inputCount; ++i) {
          weight = currentInputs[i].weight / MaximumWeight;

          if (currentInputs[i].sourceParameterIndex == -1) {
            currentInputs[i].sourceParameterIndex = model.getParameterIndex(
              currentInputs[i].source.id
            );
          }

          currentInputs[i].getNormalizedParameterValue(
            totalTranslation,
            totalAngle,
            this._parameterCaches[currentInputs[i].sourceParameterIndex],
            parameterMinimumValues[currentInputs[i].sourceParameterIndex],
            parameterMaximumValues[currentInputs[i].sourceParameterIndex],
            parameterDefaultValues[currentInputs[i].sourceParameterIndex],
            currentSetting.normalizationPosition,
            currentSetting.normalizationAngle,
            currentInputs[i].reflect,
            weight
          );
        }

        radAngle = CubismMath.degreesToRadian(-totalAngle.angle);

        totalTranslation.x =
          totalTranslation.x * CubismMath.cos(radAngle) -
          totalTranslation.y * CubismMath.sin(radAngle);
        totalTranslation.y =
          totalTranslation.x * CubismMath.sin(radAngle) +
          totalTranslation.y * CubismMath.cos(radAngle);

        // Calculate particles position.
        updateParticles(
          currentParticles,
          currentSetting.particleCount,
          totalTranslation,
          totalAngle.angle,
          this._options.wind,
          MovementThreshold * currentSetting.normalizationPosition.maximum,
          physicsDeltaTime,
          AirResistance
        );

        // Update output parameters.
        for (let i = 0; i < currentSetting.outputCount; ++i) {
          const particleIndex = currentOutputs[i].vertexIndex;

          if (currentOutputs[i].destinationParameterIndex == -1) {
            currentOutputs[i].destinationParameterIndex =
              model.getParameterIndex(currentOutputs[i].destination.id);
          }

          if (
            particleIndex < 1 ||
            particleIndex >= currentSetting.particleCount
          ) {
            continue;
          }

          const translation: CubismVector2 = new CubismVector2();
          translation.x =
            currentParticles[particleIndex].position.x -
            currentParticles[particleIndex - 1].position.x;
          translation.y =
            currentParticles[particleIndex].position.y -
            currentParticles[particleIndex - 1].position.y;

          outputValue = currentOutputs[i].getValue(
            translation,
            currentParticles,
            particleIndex,
            currentOutputs[i].reflect,
            this._options.gravity
          );

          this._currentRigOutputs.at(settingIndex).outputs.set(i, outputValue);

          const destinationParameterIndex: number =
            currentOutputs[i].destinationParameterIndex;
          const outParameterCaches: Float32Array =
            !Float32Array.prototype.slice &&
            'subarray' in Float32Array.prototype
              ? JSON.parse(
                  JSON.stringify(
                    this._parameterCaches.subarray(destinationParameterIndex)
                  )
                ) // 값 전달을 위해 JSON.parse, JSON.stringify
              : this._parameterCaches.slice(destinationParameterIndex);

          updateOutputParameterValue(
            outParameterCaches,
            parameterMinimumValues[destinationParameterIndex],
            parameterMaximumValues[destinationParameterIndex],
            outputValue,
            currentOutputs[i]
          );

          // 값 반영
          for (
            let offset: number = destinationParameterIndex, outParamIndex = 0;
            offset < this._parameterCaches.length;
            offset++, outParamIndex++
          ) {
            this._parameterCaches[offset] = outParameterCaches[outParamIndex];
          }
        }
      }
      this._currentRemainTime -= physicsDeltaTime;
    }

    const alpha: number = this._currentRemainTime / physicsDeltaTime;
    this.interpolate(model, alpha);
  }

  /**
   * 물리 연산 결과 적용
   * 진자 연산의 최신 결과와 이전 결과에서 지정된 가중치로 적용합니다.
   * @param model 물리 연산의 결과를 적용할 모델
   * @param weight 최신 결과의 가중치
   */
  public interpolate(model: CubismModel, weight: number): void {
    let currentOutputs: CubismPhysicsOutput[];
    let currentSetting: CubismPhysicsSubRig;
    const parameterValues: Float32Array = model.getModel().parameters.values;
    const parameterMaximumValues: Float32Array =
      model.getModel().parameters.maximumValues;
    const parameterMinimumValues: Float32Array =
      model.getModel().parameters.minimumValues;

    for (
      let settingIndex = 0;
      settingIndex < this._physicsRig.subRigCount;
      ++settingIndex
    ) {
      currentSetting = this._physicsRig.settings.at(settingIndex);
      currentOutputs = this._physicsRig.outputs.get(
        currentSetting.baseOutputIndex
      );

      // Load input parameters.
      for (let i = 0; i < currentSetting.outputCount; ++i) {
        if (currentOutputs[i].destinationParameterIndex == -1) {
          continue;
        }

        const destinationParameterIndex: number =
          currentOutputs[i].destinationParameterIndex;
        const outParameterValues: Float32Array =
          !Float32Array.prototype.slice && 'subarray' in Float32Array.prototype
            ? JSON.parse(
                JSON.stringify(
                  parameterValues.subarray(destinationParameterIndex)
                )
              ) // 값 전달을 위해 JSON.parse, JSON.stringify
            : parameterValues.slice(destinationParameterIndex);

        updateOutputParameterValue(
          outParameterValues,
          parameterMinimumValues[destinationParameterIndex],
          parameterMaximumValues[destinationParameterIndex],
          this._previousRigOutputs.at(settingIndex).outputs.at(i) *
            (1 - weight) +
            this._currentRigOutputs.at(settingIndex).outputs.at(i) * weight,
          currentOutputs[i]
        );

        // 값 반영
        for (
          let offset: number = destinationParameterIndex, outParamIndex = 0;
          offset < parameterValues.length;
          offset++, outParamIndex++
        ) {
          parameterValues[offset] = outParameterValues[outParamIndex];
        }
      }
    }
  }

  /**
   * 옵션 설정
   * @param options 옵션
   */
  public setOptions(options: Options): void {
    this._options = options;
  }

  /**
   * 옵션 가져오기
   * @return 옵션
   */
  public getOption(): Options {
    return this._options;
  }

  /**
   * 생성자
   */
  public constructor() {
    this._physicsRig = null;

    // 기본 옵션 설정
    this._options = new Options();
    this._options.gravity.y = -1.0;
    this._options.gravity.x = 0.0;
    this._options.wind.x = 0.0;
    this._options.wind.y = 0.0;
    this._currentRigOutputs = new csmVector<PhysicsOutput>();
    this._previousRigOutputs = new csmVector<PhysicsOutput>();
    this._currentRemainTime = 0.0;
    this._parameterCaches = null;
    this._parameterInputCaches = null;
  }

  /**
   * 소멸자 해당 처리
   */
  public release(): void {
    this._physicsRig = void 0;
    this._physicsRig = null;
  }

  /**
   * 초기화합니다.
   */
  public initialize(): void {
    let strand: CubismPhysicsParticle[];
    let currentSetting: CubismPhysicsSubRig;
    let radius: CubismVector2;

    for (
      let settingIndex = 0;
      settingIndex < this._physicsRig.subRigCount;
      ++settingIndex
    ) {
      currentSetting = this._physicsRig.settings.at(settingIndex);
      strand = this._physicsRig.particles.get(currentSetting.baseParticleIndex);

      // 파티클의 상단 초기화.
      strand[0].initialPosition = new CubismVector2(0.0, 0.0);
      strand[0].lastPosition = new CubismVector2(
        strand[0].initialPosition.x,
        strand[0].initialPosition.y
      );
      strand[0].lastGravity = new CubismVector2(0.0, -1.0);
      strand[0].lastGravity.y *= -1.0;
      strand[0].velocity = new CubismVector2(0.0, 0.0);
      strand[0].force = new CubismVector2(0.0, 0.0);

      // 파티클 초기화.
      for (let i = 1; i < currentSetting.particleCount; ++i) {
        radius = new CubismVector2(0.0, 0.0);
        radius.y = strand[i].radius;
        strand[i].initialPosition = new CubismVector2(
          strand[i - 1].initialPosition.x + radius.x,
          strand[i - 1].initialPosition.y + radius.y
        );
        strand[i].position = new CubismVector2(
          strand[i].initialPosition.x,
          strand[i].initialPosition.y
        );
        strand[i].lastPosition = new CubismVector2(
          strand[i].initialPosition.x,
          strand[i].initialPosition.y
        );
        strand[i].lastGravity = new CubismVector2(0.0, -1.0);
        strand[i].lastGravity.y *= -1.0;
        strand[i].velocity = new CubismVector2(0.0, 0.0);
        strand[i].force = new CubismVector2(0.0, 0.0);
      }
    }
  }

  _physicsRig: CubismPhysicsRig; // 물리 연산 데이터
  _options: Options; // 옵션

  _currentRigOutputs: csmVector<PhysicsOutput>; ///< 최신 진자 계산 결과
  _previousRigOutputs: csmVector<PhysicsOutput>; ///< 이전 진자 계산 결과

  _currentRemainTime: number; ///< 물리 연산이 처리하지 않은 시간

  _parameterCaches: Float32Array; ///< Evaluate에서 사용하는 파라미터 캐시
  _parameterInputCaches: Float32Array; ///< UpdateParticles가 움직일 때의 입력을 캐시
}

/**
 * 물리 연산 옵션
 */
export class Options {
  constructor() {
    this.gravity = new CubismVector2(0, 0);
    this.wind = new CubismVector2(0, 0);
  }

  gravity: CubismVector2; // 중력 방향
  wind: CubismVector2; // 바람 방향
}

/**
 * 파라미터에 적용하기 전의 물리 연산 출력 결과
 */
export class PhysicsOutput {
  constructor() {
    this.outputs = new csmVector<number>(0);
  }

  outputs: csmVector<number>; // 물리 연산 출력 결과
}

/**
 * 부호를 가져옵니다.
 *
 * @param value Evaluation target value.
 *
 * @return Sign of value.
 */
function sign(value: number): number {
  let ret = 0;

  if (value > 0.0) {
    ret = 1;
  } else if (value < 0.0) {
    ret = -1;
  }

  return ret;
}

function getInputTranslationXFromNormalizedParameterValue(
  targetTranslation: CubismVector2,
  targetAngle: { angle: number },
  value: number,
  parameterMinimumValue: number,
  parameterMaximumValue: number,
  parameterDefaultValue: number,
  normalizationPosition: CubismPhysicsNormalization,
  normalizationAngle: CubismPhysicsNormalization,
  isInverted: boolean,
  weight: number
): void {
  targetTranslation.x +=
    normalizeParameterValue(
      value,
      parameterMinimumValue,
      parameterMaximumValue,
      parameterDefaultValue,
      normalizationPosition.minimum,
      normalizationPosition.maximum,
      normalizationPosition.defalut,
      isInverted
    ) * weight;
}

function getInputTranslationYFromNormalizedParamterValue(
  targetTranslation: CubismVector2,
  targetAngle: { angle: number },
  value: number,
  parameterMinimumValue: number,
  parameterMaximumValue: number,
  parameterDefaultValue: number,
  normalizationPosition: CubismPhysicsNormalization,
  normalizationAngle: CubismPhysicsNormalization,
  isInverted: boolean,
  weight: number
): void {
  targetTranslation.y +=
    normalizeParameterValue(
      value,
      parameterMinimumValue,
      parameterMaximumValue,
      parameterDefaultValue,
      normalizationPosition.minimum,
      normalizationPosition.maximum,
      normalizationPosition.defalut,
      isInverted
    ) * weight;
}

function getInputAngleFromNormalizedParameterValue(
  targetTranslation: CubismVector2,
  targetAngle: { angle: number },
  value: number,
  parameterMinimumValue: number,
  parameterMaximumValue: number,
  parameterDefaultValue: number,
  normalizaitionPosition: CubismPhysicsNormalization,
  normalizationAngle: CubismPhysicsNormalization,
  isInverted: boolean,
  weight: number
): void {
  targetAngle.angle +=
    normalizeParameterValue(
      value,
      parameterMinimumValue,
      parameterMaximumValue,
      parameterDefaultValue,
      normalizationAngle.minimum,
      normalizationAngle.maximum,
      normalizationAngle.defalut,
      isInverted
    ) * weight;
}

function getOutputTranslationX(
  translation: CubismVector2,
  particles: CubismPhysicsParticle[],
  particleIndex: number,
  isInverted: boolean,
  parentGravity: CubismVector2
): number {
  let outputValue: number = translation.x;

  if (isInverted) {
    outputValue *= -1.0;
  }

  return outputValue;
}

function getOutputTranslationY(
  translation: CubismVector2,
  particles: CubismPhysicsParticle[],
  particleIndex: number,
  isInverted: boolean,
  parentGravity: CubismVector2
): number {
  let outputValue: number = translation.y;

  if (isInverted) {
    outputValue *= -1.0;
  }
  return outputValue;
}

function getOutputAngle(
  translation: CubismVector2,
  particles: CubismPhysicsParticle[],
  particleIndex: number,
  isInverted: boolean,
  parentGravity: CubismVector2
): number {
  let outputValue: number;

  if (particleIndex >= 2) {
    parentGravity = particles[particleIndex - 1].position.substract(
      particles[particleIndex - 2].position
    );
  } else {
    parentGravity = parentGravity.multiplyByScaler(-1.0);
  }

  outputValue = CubismMath.directionToRadian(parentGravity, translation);

  if (isInverted) {
    outputValue *= -1.0;
  }

  return outputValue;
}

function getRangeValue(min: number, max: number): number {
  const maxValue: number = CubismMath.max(min, max);
  const minValue: number = CubismMath.min(min, max);

  return CubismMath.abs(maxValue - minValue);
}

function getDefaultValue(min: number, max: number): number {
  const minValue: number = CubismMath.min(min, max);
  return minValue + getRangeValue(min, max) / 2.0;
}

function getOutputScaleTranslationX(
  translationScale: CubismVector2,
  angleScale: number
): number {
  return JSON.parse(JSON.stringify(translationScale.x));
}

function getOutputScaleTranslationY(
  translationScale: CubismVector2,
  angleScale: number
): number {
  return JSON.parse(JSON.stringify(translationScale.y));
}

function getOutputScaleAngle(
  translationScale: CubismVector2,
  angleScale: number
): number {
  return JSON.parse(JSON.stringify(angleScale));
}

/**
 * 파티클을 업데이트합니다.
 *
 * @param strand                Target array of particle.
 * @param strandCount           Count of particle.
 * @param totalTranslation      Total translation value.
 * @param totalAngle            Total angle.
 * @param windDirection         Direction of Wind.
 * @param thresholdValue        Threshold of movement.
 * @param deltaTimeSeconds      Delta time.
 * @param airResistance         Air resistance.
 */
function updateParticles(
  strand: CubismPhysicsParticle[],
  strandCount: number,
  totalTranslation: CubismVector2,
  totalAngle: number,
  windDirection: CubismVector2,
  thresholdValue: number,
  deltaTimeSeconds: number,
  airResistance: number
) {
  let delay: number;
  let radian: number;
  let direction: CubismVector2 = new CubismVector2(0.0, 0.0);
  let velocity: CubismVector2 = new CubismVector2(0.0, 0.0);
  let force: CubismVector2 = new CubismVector2(0.0, 0.0);
  let newDirection: CubismVector2 = new CubismVector2(0.0, 0.0);

  strand[0].position = new CubismVector2(
    totalTranslation.x,
    totalTranslation.y
  );

  const totalRadian: number = CubismMath.degreesToRadian(totalAngle);
  const currentGravity: CubismVector2 =
    CubismMath.radianToDirection(totalRadian);
  currentGravity.normalize();

  for (let i = 1; i < strandCount; ++i) {
    strand[i].force = currentGravity
      .multiplyByScaler(strand[i].acceleration)
      .add(windDirection);

    strand[i].lastPosition = new CubismVector2(
      strand[i].position.x,
      strand[i].position.y
    );

    delay = strand[i].delay * deltaTimeSeconds * 30.0;

    direction = strand[i].position.substract(strand[i - 1].position);

    radian =
      CubismMath.directionToRadian(strand[i].lastGravity, currentGravity) /
      airResistance;

    direction.x =
      CubismMath.cos(radian) * direction.x -
      direction.y * CubismMath.sin(radian);
    direction.y =
      CubismMath.sin(radian) * direction.x +
      direction.y * CubismMath.cos(radian);

    strand[i].position = strand[i - 1].position.add(direction);

    velocity = strand[i].velocity.multiplyByScaler(delay);
    force = strand[i].force.multiplyByScaler(delay).multiplyByScaler(delay);

    strand[i].position = strand[i].position.add(velocity).add(force);

    newDirection = strand[i].position.substract(strand[i - 1].position);
    newDirection.normalize();

    strand[i].position = strand[i - 1].position.add(
      newDirection.multiplyByScaler(strand[i].radius)
    );

    if (CubismMath.abs(strand[i].position.x) < thresholdValue) {
      strand[i].position.x = 0.0;
    }

    if (delay != 0.0) {
      strand[i].velocity = strand[i].position.substract(strand[i].lastPosition);
      strand[i].velocity = strand[i].velocity.divisionByScalar(delay);
      strand[i].velocity = strand[i].velocity.multiplyByScaler(
        strand[i].mobility
      );
    }

    strand[i].force = new CubismVector2(0.0, 0.0);
    strand[i].lastGravity = new CubismVector2(
      currentGravity.x,
      currentGravity.y
    );
  }
}

/**
 * 안정화를 위해 파티클을 업데이트합니다.
 *
 * @param strand                Target array of particle.
 * @param strandCount           Count of particle.
 * @param totalTranslation      Total translation value.
 * @param totalAngle            Total angle.
 * @param windDirection         Direction of Wind.
 * @param thresholdValue        Threshold of movement.
 */
function updateParticlesForStabilization(
  strand: CubismPhysicsParticle[],
  strandCount: number,
  totalTranslation: CubismVector2,
  totalAngle: number,
  windDirection: CubismVector2,
  thresholdValue: number
) {
  let force: CubismVector2 = new CubismVector2(0.0, 0.0);

  strand[0].position = new CubismVector2(
    totalTranslation.x,
    totalTranslation.y
  );

  const totalRadian: number = CubismMath.degreesToRadian(totalAngle);
  const currentGravity: CubismVector2 =
    CubismMath.radianToDirection(totalRadian);
  currentGravity.normalize();

  for (let i = 1; i < strandCount; ++i) {
    strand[i].force = currentGravity
      .multiplyByScaler(strand[i].acceleration)
      .add(windDirection);

    strand[i].lastPosition = new CubismVector2(
      strand[i].position.x,
      strand[i].position.y
    );

    strand[i].velocity = new CubismVector2(0.0, 0.0);
    force = strand[i].force;
    force.normalize();

    force = force.multiplyByScaler(strand[i].radius);
    strand[i].position = strand[i - 1].position.add(force);

    if (CubismMath.abs(strand[i].position.x) < thresholdValue) {
      strand[i].position.x = 0.0;
    }

    strand[i].force = new CubismVector2(0.0, 0.0);
    strand[i].lastGravity = new CubismVector2(
      currentGravity.x,
      currentGravity.y
    );
  }
}

/**
 * 출력 파라미터 값을 업데이트합니다.
 * @param parameterValue            Target parameter value.
 * @param parameterValueMinimum     Minimum of parameter value.
 * @param parameterValueMaximum     Maximum of parameter value.
 * @param translation               Translation value.
 */
function updateOutputParameterValue(
  parameterValue: Float32Array,
  parameterValueMinimum: number,
  parameterValueMaximum: number,
  translation: number,
  output: CubismPhysicsOutput
): void {
  let value: number;
  const outputScale: number = output.getScale(
    output.translationScale,
    output.angleScale
  );

  value = translation * outputScale;

  if (value < parameterValueMinimum) {
    if (value < output.valueBelowMinimum) {
      output.valueBelowMinimum = value;
    }

    value = parameterValueMinimum;
  } else if (value > parameterValueMaximum) {
    if (value > output.valueExceededMaximum) {
      output.valueExceededMaximum = value;
    }

    value = parameterValueMaximum;
  }

  const weight: number = output.weight / MaximumWeight;

  if (weight >= 1.0) {
    parameterValue[0] = value;
  } else {
    value = parameterValue[0] * (1.0 - weight) + value * weight;
    parameterValue[0] = value;
  }
}

function normalizeParameterValue(
  value: number,
  parameterMinimum: number,
  parameterMaximum: number,
  parameterDefault: number,
  normalizedMinimum: number,
  normalizedMaximum: number,
  normalizedDefault: number,
  isInverted: boolean
) {
  let result = 0.0;

  const maxValue: number = CubismMath.max(parameterMaximum, parameterMinimum);

  if (maxValue < value) {
    value = maxValue;
  }

  const minValue: number = CubismMath.min(parameterMaximum, parameterMinimum);

  if (minValue > value) {
    value = minValue;
  }

  const minNormValue: number = CubismMath.min(
    normalizedMinimum,
    normalizedMaximum
  );
  const maxNormValue: number = CubismMath.max(
    normalizedMinimum,
    normalizedMaximum
  );
  const middleNormValue: number = normalizedDefault;

  const middleValue: number = getDefaultValue(minValue, maxValue);
  const paramValue: number = value - middleValue;

  switch (sign(paramValue)) {
    case 1: {
      const nLength: number = maxNormValue - middleNormValue;
      const pLength: number = maxValue - middleValue;

      if (pLength != 0.0) {
        result = paramValue * (nLength / pLength);
        result += middleNormValue;
      }

      break;
    }
    case -1: {
      const nLength: number = minNormValue - middleNormValue;
      const pLength: number = minValue - middleValue;

      if (pLength != 0.0) {
        result = paramValue * (nLength / pLength);
        result += middleNormValue;
      }

      break;
    }
    case 0: {
      result = middleNormValue;

      break;
    }
    default: {
      break;
    }
  }

  return isInverted ? result : result * -1.0;
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismphysics';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismPhysics = $.CubismPhysics;
  export type CubismPhysics = $.CubismPhysics;
  export const Options = $.Options;
  export type Options = $.Options;
}