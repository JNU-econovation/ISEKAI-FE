/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismMatrix44 } from '../math/cubismmatrix44';
import { CubismModel } from '../model/cubismmodel';
import { csmMap, iterator } from '../type/csmmap';
import { csmRect } from '../type/csmrectf';
import { csmVector } from '../type/csmvector';
import { CubismLogError } from '../utils/cubismdebug';
import { CubismBlendMode, CubismTextureColor } from './cubismrenderer';
import { CubismRenderer_WebGL } from './cubismrenderer_webgl';

let s_instance: CubismShaderManager_WebGL; // 인스턴스 (싱글톤)
const ShaderCount = 10; // 셰이더 수 = 마스크 생성용 + (일반용 + 덧셈 + 곱셈) * (마스크 없는 곱셈 완료 알파 지원 버전 + 마스크 있는 곱셈 완료 알파 지원 버전 + 마스크 있는 반전 곱셈 완료 알파 지원 버전)

/**
 * WebGL용 셰이더 프로그램을 생성·파기하는 클래스
 */
export class CubismShader_WebGL {
  /**
   * 생성자
   */
  public constructor() {
    this._shaderSets = new csmVector<CubismShaderSet>();
  }

  /**
   * 소멸자 해당 처리
   */
  public release(): void {
    this.releaseShaderProgram();
  }

  /**
   * 그리기용 셰이더 프로그램의 일련의 설정을 실행합니다.
   * @param renderer 렌더러
   * @param model 그릴 대상 모델
   * @param index 그릴 대상 메쉬의 인덱스
   */
  public setupShaderProgramForDraw(
    renderer: CubismRenderer_WebGL,
    model: Readonly<CubismModel>,
    index: number
  ): void {
    if (!renderer.isPremultipliedAlpha()) {
      CubismLogError('NoPremultipliedAlpha is not allowed');
    }

    if (this._shaderSets.getSize() == 0) {
      this.generateShaders();
    }

    // Blending
    let srcColor: number;
    let dstColor: number;
    let srcAlpha: number;
    let dstAlpha: number;

    // _shaderSets용 오프셋 계산
    const masked: boolean = renderer.getClippingContextBufferForDraw() != null; // 이 그리기 개체는 마스크 대상인가
    const invertedMask: boolean = model.getDrawableInvertedMaskBit(index);
    const offset: number = masked ? (invertedMask ? 2 : 1) : 0;

    let shaderSet: CubismShaderSet;
    switch (model.getDrawableBlendMode(index)) {
      case CubismBlendMode.CubismBlendMode_Normal:
      default:
        shaderSet = this._shaderSets.at(
          ShaderNames.ShaderNames_NormalPremultipliedAlpha + offset
        );
        srcColor = this.gl.ONE;
        dstColor = this.gl.ONE_MINUS_SRC_ALPHA;
        srcAlpha = this.gl.ONE;
        dstAlpha = this.gl.ONE_MINUS_SRC_ALPHA;
        break;

      case CubismBlendMode.CubismBlendMode_Additive:
        shaderSet = this._shaderSets.at(
          ShaderNames.ShaderNames_AddPremultipliedAlpha + offset
        );
        srcColor = this.gl.ONE;
        dstColor = this.gl.ONE;
        srcAlpha = this.gl.ZERO;
        dstAlpha = this.gl.ONE;
        break;

      case CubismBlendMode.CubismBlendMode_Multiplicative:
        shaderSet = this._shaderSets.at(
          ShaderNames.ShaderNames_MultPremultipliedAlpha + offset
        );
        srcColor = this.gl.DST_COLOR;
        dstColor = this.gl.ONE_MINUS_SRC_ALPHA;
        srcAlpha = this.gl.ZERO;
        dstAlpha = this.gl.ONE;
        break;
    }

    this.gl.useProgram(shaderSet.shaderProgram);

    // 정점 배열 설정
    if (renderer._bufferData.vertex == null) {
      renderer._bufferData.vertex = this.gl.createBuffer();
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer._bufferData.vertex);

    // 정점 배열 설정
    const vertexArray: Float32Array = model.getDrawableVertices(index);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexArray, this.gl.DYNAMIC_DRAW);
    this.gl.enableVertexAttribArray(shaderSet.attributePositionLocation);
    this.gl.vertexAttribPointer(
      shaderSet.attributePositionLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    // 텍스처 정점 설정
    if (renderer._bufferData.uv == null) {
      renderer._bufferData.uv = this.gl.createBuffer();
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer._bufferData.uv);
    const uvArray: Float32Array = model.getDrawableVertexUvs(index);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, uvArray, this.gl.DYNAMIC_DRAW);
    this.gl.enableVertexAttribArray(shaderSet.attributeTexCoordLocation);
    this.gl.vertexAttribPointer(
      shaderSet.attributeTexCoordLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    if (masked) {
      this.gl.activeTexture(this.gl.TEXTURE1);

      // frameBuffer에 쓰여진 텍스처
      const tex: WebGLTexture = renderer
        .getClippingContextBufferForDraw()
        .getClippingManager()
        .getColorBuffer()
        .at(renderer.getClippingContextBufferForDraw()._bufferIndex);
      this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
      this.gl.uniform1i(shaderSet.samplerTexture1Location, 1);

      // view 좌표를 ClippingContext 좌표로 변환하기 위한 행렬 설정
      this.gl.uniformMatrix4fv(
        shaderSet.uniformClipMatrixLocation,
        false,
        renderer.getClippingContextBufferForDraw()._matrixForDraw.getArray()
      );

      // 사용할 컬러 채널 설정
      const channelIndex: number =
        renderer.getClippingContextBufferForDraw()._layoutChannelIndex;
      const colorChannel: CubismTextureColor = renderer
        .getClippingContextBufferForDraw()
        .getClippingManager()
        .getChannelFlagAsColor(channelIndex);
      this.gl.uniform4f(
        shaderSet.uniformChannelFlagLocation,
        colorChannel.r,
        colorChannel.g,
        colorChannel.b,
        colorChannel.a
      );
    }

    // 텍스처 설정
    const textureNo: number = model.getDrawableTextureIndex(index);
    const textureId: WebGLTexture = renderer
      .getBindedTextures()
      .getValue(textureNo);
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, textureId);
    this.gl.uniform1i(shaderSet.samplerTexture0Location, 0);

    //좌표 변환
    const matrix4x4: CubismMatrix44 = renderer.getMvpMatrix();
    this.gl.uniformMatrix4fv(
      shaderSet.uniformMatrixLocation,
      false,
      matrix4x4.getArray()
    );

    //기본 색상 가져오기
    const baseColor: CubismTextureColor = renderer.getModelColorWithOpacity(
      model.getDrawableOpacity(index)
    );
    const multiplyColor: CubismTextureColor = model.getMultiplyColor(index);
    const screenColor: CubismTextureColor = model.getScreenColor(index);

    this.gl.uniform4f(
      shaderSet.uniformBaseColorLocation,
      baseColor.r,
      baseColor.g,
      baseColor.b,
      baseColor.a
    );

    this.gl.uniform4f(
      shaderSet.uniformMultiplyColorLocation,
      multiplyColor.r,
      multiplyColor.g,
      multiplyColor.b,
      multiplyColor.a
    );

    this.gl.uniform4f(
      shaderSet.uniformScreenColorLocation,
      screenColor.r,
      screenColor.g,
      screenColor.b,
      screenColor.a
    );

    // IBO를 생성하고 데이터를 전송
    if (renderer._bufferData.index == null) {
      renderer._bufferData.index = this.gl.createBuffer();
    }
    const indexArray: Uint16Array = model.getDrawableVertexIndices(index);

    this.gl.bindBuffer(
      this.gl.ELEMENT_ARRAY_BUFFER,
      renderer._bufferData.index
    );
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      indexArray,
      this.gl.DYNAMIC_DRAW
    );

    this.gl.blendFuncSeparate(srcColor, dstColor, srcAlpha, dstAlpha);
  }

  /**
   * 마스크용 셰이더 프로그램의 일련의 설정을 실행합니다.
   * @param renderer 렌더러
   * @param model 그릴 대상 모델
   * @param index 그릴 대상 메쉬의 인덱스
   */
  public setupShaderProgramForMask(
    renderer: CubismRenderer_WebGL,
    model: Readonly<CubismModel>,
    index: number
  ): void {
    if (!renderer.isPremultipliedAlpha()) {
      CubismLogError('NoPremultipliedAlpha is not allowed');
    }

    if (this._shaderSets.getSize() == 0) {
      this.generateShaders();
    }

    const shaderSet: CubismShaderSet = this._shaderSets.at(
      ShaderNames.ShaderNames_SetupMask
    );
    this.gl.useProgram(shaderSet.shaderProgram);

    // 정점 배열 설정
    if (renderer._bufferData.vertex == null) {
      renderer._bufferData.vertex = this.gl.createBuffer();
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer._bufferData.vertex);
    const vertexArray: Float32Array = model.getDrawableVertices(index);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexArray, this.gl.DYNAMIC_DRAW);
    this.gl.enableVertexAttribArray(shaderSet.attributePositionLocation);
    this.gl.vertexAttribPointer(
      shaderSet.attributePositionLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    //텍스처 설정
    if (renderer._bufferData.uv == null) {
      renderer._bufferData.uv = this.gl.createBuffer();
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer._bufferData.uv);
    const textureNo: number = model.getDrawableTextureIndex(index);
    const textureId: WebGLTexture = renderer
      .getBindedTextures()
      .getValue(textureNo);
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, textureId);
    this.gl.uniform1i(shaderSet.samplerTexture0Location, 0);

    // 텍스처 정점 설정
    if (renderer._bufferData.uv == null) {
      renderer._bufferData.uv = this.gl.createBuffer();
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer._bufferData.uv);
    const uvArray: Float32Array = model.getDrawableVertexUvs(index);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, uvArray, this.gl.DYNAMIC_DRAW);
    this.gl.enableVertexAttribArray(shaderSet.attributeTexCoordLocation);
    this.gl.vertexAttribPointer(
      shaderSet.attributeTexCoordLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    // 채널
    const context = renderer.getClippingContextBufferForMask();
    const channelIndex: number =
      renderer.getClippingContextBufferForMask()._layoutChannelIndex;
    const colorChannel: CubismTextureColor = renderer
      .getClippingContextBufferForMask()
      .getClippingManager()
      .getChannelFlagAsColor(channelIndex);
    this.gl.uniform4f(
      shaderSet.uniformChannelFlagLocation,
      colorChannel.r,
      colorChannel.g,
      colorChannel.b,
      colorChannel.a
    );

    this.gl.uniformMatrix4fv(
      shaderSet.uniformClipMatrixLocation,
      false,
      renderer.getClippingContextBufferForMask()._matrixForMask.getArray()
    );

    const rect: csmRect =
      renderer.getClippingContextBufferForMask()._layoutBounds;

    this.gl.uniform4f(
      shaderSet.uniformBaseColorLocation,
      rect.x * 2.0 - 1.0,
      rect.y * 2.0 - 1.0,
      rect.getRight() * 2.0 - 1.0,
      rect.getBottom() * 2.0 - 1.0
    );

    const multiplyColor: CubismTextureColor = model.getMultiplyColor(index);
    const screenColor: CubismTextureColor = model.getScreenColor(index);

    this.gl.uniform4f(
      shaderSet.uniformMultiplyColorLocation,
      multiplyColor.r,
      multiplyColor.g,
      multiplyColor.b,
      multiplyColor.a
    );

    this.gl.uniform4f(
      shaderSet.uniformScreenColorLocation,
      screenColor.r,
      screenColor.g,
      screenColor.b,
      screenColor.a
    );

    // Blending
    const srcColor: number = this.gl.ZERO;
    const dstColor: number = this.gl.ONE_MINUS_SRC_COLOR;
    const srcAlpha: number = this.gl.ZERO;
    const dstAlpha: number = this.gl.ONE_MINUS_SRC_ALPHA;

    // IBO를 생성하고 데이터를 전송
    if (renderer._bufferData.index == null) {
      renderer._bufferData.index = this.gl.createBuffer();
    }
    const indexArray: Uint16Array = model.getDrawableVertexIndices(index);

    this.gl.bindBuffer(
      this.gl.ELEMENT_ARRAY_BUFFER,
      renderer._bufferData.index
    );
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      indexArray,
      this.gl.DYNAMIC_DRAW
    );

    this.gl.blendFuncSeparate(srcColor, dstColor, srcAlpha, dstAlpha);
  }

  /**
   * 셰이더 프로그램을 해제합니다.
   */
  public releaseShaderProgram(): void {
    for (let i = 0; i < this._shaderSets.getSize(); i++) {
      this.gl.deleteProgram(this._shaderSets.at(i).shaderProgram);
      this._shaderSets.at(i).shaderProgram = 0;
      this._shaderSets.set(i, void 0);
      this._shaderSets.set(i, null);
    }
  }

  /**
   * 셰이더 프로그램을 초기화합니다.
   * @param vertShaderSrc 정점 셰이더 소스
   * @param fragShaderSrc 프래그먼트 셰이더 소스
   */
  public generateShaders(): void {
    for (let i = 0; i < ShaderCount; i++) {
      this._shaderSets.pushBack(new CubismShaderSet());
    }

    this._shaderSets.at(0).shaderProgram = this.loadShaderProgram(
      vertexShaderSrcSetupMask,
      fragmentShaderSrcsetupMask
    );

    this._shaderSets.at(1).shaderProgram = this.loadShaderProgram(
      vertexShaderSrc,
      fragmentShaderSrcPremultipliedAlpha
    );
    this._shaderSets.at(2).shaderProgram = this.loadShaderProgram(
      vertexShaderSrcMasked,
      fragmentShaderSrcMaskPremultipliedAlpha
    );
    this._shaderSets.at(3).shaderProgram = this.loadShaderProgram(
      vertexShaderSrcMasked,
      fragmentShaderSrcMaskInvertedPremultipliedAlpha
    );

    // 덧셈도 일반과 동일한 셰이더를 이용
    this._shaderSets.at(4).shaderProgram = this._shaderSets.at(1).shaderProgram;
    this._shaderSets.at(5).shaderProgram = this._shaderSets.at(2).shaderProgram;
    this._shaderSets.at(6).shaderProgram = this._shaderSets.at(3).shaderProgram;

    // 곱셈도 일반과 동일한 셰이더를 이용
    this._shaderSets.at(7).shaderProgram = this._shaderSets.at(1).shaderProgram;
    this._shaderSets.at(8).shaderProgram = this._shaderSets.at(2).shaderProgram;
    this._shaderSets.at(9).shaderProgram = this._shaderSets.at(3).shaderProgram;

    // SetupMask
    this._shaderSets.at(0).attributePositionLocation =
      this.gl.getAttribLocation(
        this._shaderSets.at(0).shaderProgram,
        'a_position'
      );
    this._shaderSets.at(0).attributeTexCoordLocation =
      this.gl.getAttribLocation(
        this._shaderSets.at(0).shaderProgram,
        'a_texCoord'
      );
    this._shaderSets.at(0).samplerTexture0Location = this.gl.getUniformLocation(
      this._shaderSets.at(0).shaderProgram,
      's_texture0'
    );
    this._shaderSets.at(0).uniformClipMatrixLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(0).shaderProgram,
        'u_clipMatrix'
      );
    this._shaderSets.at(0).uniformChannelFlagLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(0).shaderProgram,
        'u_channelFlag'
      );
    this._shaderSets.at(0).uniformBaseColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(0).shaderProgram,
        'u_baseColor'
      );
    this._shaderSets.at(0).uniformMultiplyColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(0).shaderProgram,
        'u_multiplyColor'
      );
    this._shaderSets.at(0).uniformScreenColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(0).shaderProgram,
        'u_screenColor'
      );

    // 일반 (PremultipliedAlpha)
    this._shaderSets.at(1).attributePositionLocation =
      this.gl.getAttribLocation(
        this._shaderSets.at(1).shaderProgram,
        'a_position'
      );
    this._shaderSets.at(1).attributeTexCoordLocation =
      this.gl.getAttribLocation(
        this._shaderSets.at(1).shaderProgram,
        'a_texCoord'
      );
    this._shaderSets.at(1).samplerTexture0Location = this.gl.getUniformLocation(
      this._shaderSets.at(1).shaderProgram,
      's_texture0'
    );
    this._shaderSets.at(1).uniformMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets.at(1).shaderProgram,
      'u_matrix'
    );
    this._shaderSets.at(1).uniformBaseColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(1).shaderProgram,
        'u_baseColor'
      );
    this._shaderSets.at(1).uniformMultiplyColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(1).shaderProgram,
        'u_multiplyColor'
      );
    this._shaderSets.at(1).uniformScreenColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(1).shaderProgram,
        'u_screenColor'
      );

    // 일반 (클리핑, PremultipliedAlpha)
    this._shaderSets.at(2).attributePositionLocation =
      this.gl.getAttribLocation(
        this._shaderSets.at(2).shaderProgram,
        'a_position'
      );
    this._shaderSets.at(2).attributeTexCoordLocation =
      this.gl.getAttribLocation(
        this._shaderSets.at(2).shaderProgram,
        'a_texCoord'
      );
    this._shaderSets.at(2).samplerTexture0Location = this.gl.getUniformLocation(
      this._shaderSets.at(2).shaderProgram,
      's_texture0'
    );
    this._shaderSets.at(2).samplerTexture1Location = this.gl.getUniformLocation(
      this._shaderSets.at(2).shaderProgram,
      's_texture1'
    );
    this._shaderSets.at(2).uniformMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets.at(2).shaderProgram,
      'u_matrix'
    );
    this._shaderSets.at(2).uniformClipMatrixLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(2).shaderProgram,
        'u_clipMatrix'
      );
    this._shaderSets.at(2).uniformChannelFlagLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(2).shaderProgram,
        'u_channelFlag'
      );
    this._shaderSets.at(2).uniformBaseColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(2).shaderProgram,
        'u_baseColor'
      );
    this._shaderSets.at(2).uniformMultiplyColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(2).shaderProgram,
        'u_multiplyColor'
      );
    this._shaderSets.at(2).uniformScreenColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(2).shaderProgram,
        'u_screenColor'
      );

    // 일반 (클리핑·반전, PremultipliedAlpha)
    this._shaderSets.at(3).attributePositionLocation =
      this.gl.getAttribLocation(
        this._shaderSets.at(3).shaderProgram,
        'a_position'
      );
    this._shaderSets.at(3).attributeTexCoordLocation =
      this.gl.getAttribLocation(
        this._shaderSets.at(3).shaderProgram,
        'a_texCoord'
      );
    this._shaderSets.at(3).samplerTexture0Location = this.gl.getUniformLocation(
      this._shaderSets.at(3).shaderProgram,
      's_texture0'
    );
    this._shaderSets.at(3).samplerTexture1Location = this.gl.getUniformLocation(
      this._shaderSets.at(3).shaderProgram,
      's_texture1'
    );
    this._shaderSets.at(3).uniformMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets.at(3).shaderProgram,
      'u_matrix'
    );
    this._shaderSets.at(3).uniformClipMatrixLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(3).shaderProgram,
        'u_clipMatrix'
      );
    this._shaderSets.at(3).uniformChannelFlagLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(3).shaderProgram,
        'u_channelFlag'
      );
    this._shaderSets.at(3).uniformBaseColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(3).shaderProgram,
        'u_baseColor'
      );
    this._shaderSets.at(3).uniformMultiplyColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(3).shaderProgram,
        'u_multiplyColor'
      );
    this._shaderSets.at(3).uniformScreenColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(3).shaderProgram,
        'u_screenColor'
      );

    // 덧셈 (PremultipliedAlpha)
    this._shaderSets.at(4).attributePositionLocation =
      this.gl.getAttribLocation(
        this._shaderSets.at(4).shaderProgram,
        'a_position'
      );
    this._shaderSets.at(4).attributeTexCoordLocation =
      this.gl.getAttribLocation(
        this._shaderSets.at(4).shaderProgram,
        'a_texCoord'
      );
    this._shaderSets.at(4).samplerTexture0Location = this.gl.getUniformLocation(
      this._shaderSets.at(4).shaderProgram,
      's_texture0'
    );
    this._shaderSets.at(4).uniformMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets.at(4).shaderProgram,
      'u_matrix'
    );
    this._shaderSets.at(4).uniformBaseColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(4).shaderProgram,
        'u_baseColor'
      );
    this._shaderSets.at(4).uniformMultiplyColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(4).shaderProgram,
        'u_multiplyColor'
      );
    this._shaderSets.at(4).uniformScreenColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(4).shaderProgram,
        'u_screenColor'
      );

    // 덧셈 (클리핑, PremultipliedAlpha)
    this._shaderSets.at(5).attributePositionLocation =
      this.gl.getAttribLocation(
        this._shaderSets.at(5).shaderProgram,
        'a_position'
      );
    this._shaderSets.at(5).attributeTexCoordLocation =
      this.gl.getAttribLocation(
        this._shaderSets.at(5).shaderProgram,
        'a_texCoord'
      );
    this._shaderSets.at(5).samplerTexture0Location = this.gl.getUniformLocation(
      this._shaderSets.at(5).shaderProgram,
      's_texture0'
    );
    this._shaderSets.at(5).samplerTexture1Location = this.gl.getUniformLocation(
      this._shaderSets.at(5).shaderProgram,
      's_texture1'
    );
    this._shaderSets.at(5).uniformMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets.at(5).shaderProgram,
      'u_matrix'
    );
    this._shaderSets.at(5).uniformClipMatrixLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(5).shaderProgram,
        'u_clipMatrix'
      );
    this._shaderSets.at(5).uniformChannelFlagLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(5).shaderProgram,
        'u_channelFlag'
      );
    this._shaderSets.at(5).uniformBaseColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(5).shaderProgram,
        'u_baseColor'
      );
    this._shaderSets.at(5).uniformMultiplyColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(5).shaderProgram,
        'u_multiplyColor'
      );
    this._shaderSets.at(5).uniformScreenColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(5).shaderProgram,
        'u_screenColor'
      );

    // 덧셈 (클리핑·반전, PremultipliedAlpha)
    this._shaderSets.at(6).attributePositionLocation =
      this.gl.getAttribLocation(
        this._shaderSets.at(6).shaderProgram,
        'a_position'
      );
    this._shaderSets.at(6).attributeTexCoordLocation =
      this.gl.getAttribLocation(
        this._shaderSets.at(6).shaderProgram,
        'a_texCoord'
      );
    this._shaderSets.at(6).samplerTexture0Location = this.gl.getUniformLocation(
      this._shaderSets.at(6).shaderProgram,
      's_texture0'
    );
    this._shaderSets.at(6).samplerTexture1Location = this.gl.getUniformLocation(
      this._shaderSets.at(6).shaderProgram,
      's_texture1'
    );
    this._shaderSets.at(6).uniformMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets.at(6).shaderProgram,
      'u_matrix'
    );
    this._shaderSets.at(6).uniformClipMatrixLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(6).shaderProgram,
        'u_clipMatrix'
      );
    this._shaderSets.at(6).uniformChannelFlagLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(6).shaderProgram,
        'u_channelFlag'
      );
    this._shaderSets.at(6).uniformBaseColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(6).shaderProgram,
        'u_baseColor'
      );
    this._shaderSets.at(6).uniformMultiplyColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(6).shaderProgram,
        'u_multiplyColor'
      );
    this._shaderSets.at(6).uniformScreenColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(6).shaderProgram,
        'u_screenColor'
      );

    // 곱셈 (PremultipliedAlpha)
    this._shaderSets.at(7).attributePositionLocation =
      this.gl.getAttribLocation(
        this._shaderSets.at(7).shaderProgram,
        'a_position'
      );
    this._shaderSets.at(7).attributeTexCoordLocation =
      this.gl.getAttribLocation(
        this._shaderSets.at(7).shaderProgram,
        'a_texCoord'
      );
    this._shaderSets.at(7).samplerTexture0Location = this.gl.getUniformLocation(
      this._shaderSets.at(7).shaderProgram,
      's_texture0'
    );
    this._shaderSets.at(7).uniformMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets.at(7).shaderProgram,
      'u_matrix'
    );
    this._shaderSets.at(7).uniformBaseColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(7).shaderProgram,
        'u_baseColor'
      );
    this._shaderSets.at(7).uniformMultiplyColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(7).shaderProgram,
        'u_multiplyColor'
      );
    this._shaderSets.at(7).uniformScreenColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(7).shaderProgram,
        'u_screenColor'
      );

    // 곱셈 (클리핑, PremultipliedAlpha)
    this._shaderSets.at(8).attributePositionLocation =
      this.gl.getAttribLocation(
        this._shaderSets.at(8).shaderProgram,
        'a_position'
      );
    this._shaderSets.at(8).attributeTexCoordLocation =
      this.gl.getAttribLocation(
        this._shaderSets.at(8).shaderProgram,
        'a_texCoord'
      );
    this._shaderSets.at(8).samplerTexture0Location = this.gl.getUniformLocation(
      this._shaderSets.at(8).shaderProgram,
      's_texture0'
    );
    this._shaderSets.at(8).samplerTexture1Location = this.gl.getUniformLocation(
      this._shaderSets.at(8).shaderProgram,
      's_texture1'
    );
    this._shaderSets.at(8).uniformMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets.at(8).shaderProgram,
      'u_matrix'
    );
    this._shaderSets.at(8).uniformClipMatrixLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(8).shaderProgram,
        'u_clipMatrix'
      );
    this._shaderSets.at(8).uniformChannelFlagLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(8).shaderProgram,
        'u_channelFlag'
      );
    this._shaderSets.at(8).uniformBaseColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(8).shaderProgram,
        'u_baseColor'
      );
    this._shaderSets.at(8).uniformMultiplyColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(8).shaderProgram,
        'u_multiplyColor'
      );
    this._shaderSets.at(8).uniformScreenColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(8).shaderProgram,
        'u_screenColor'
      );

    // 곱셈 (클리핑·반전, PremultipliedAlpha)
    this._shaderSets.at(9).attributePositionLocation =
      this.gl.getAttribLocation(
        this._shaderSets.at(9).shaderProgram,
        'a_position'
      );
    this._shaderSets.at(9).attributeTexCoordLocation =
      this.gl.getAttribLocation(
        this._shaderSets.at(9).shaderProgram,
        'a_texCoord'
      );
    this._shaderSets.at(9).samplerTexture0Location = this.gl.getUniformLocation(
      this._shaderSets.at(9).shaderProgram,
      's_texture0'
    );
    this._shaderSets.at(9).samplerTexture1Location = this.gl.getUniformLocation(
      this._shaderSets.at(9).shaderProgram,
      's_texture1'
    );
    this._shaderSets.at(9).uniformMatrixLocation = this.gl.getUniformLocation(
      this._shaderSets.at(9).shaderProgram,
      'u_matrix'
    );
    this._shaderSets.at(9).uniformClipMatrixLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(9).shaderProgram,
        'u_clipMatrix'
      );
    this._shaderSets.at(9).uniformChannelFlagLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(9).shaderProgram,
        'u_channelFlag'
      );
    this._shaderSets.at(9).uniformBaseColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(9).shaderProgram,
        'u_baseColor'
      );
    this._shaderSets.at(9).uniformMultiplyColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(9).shaderProgram,
        'u_multiplyColor'
      );
    this._shaderSets.at(9).uniformScreenColorLocation =
      this.gl.getUniformLocation(
        this._shaderSets.at(9).shaderProgram,
        'u_screenColor'
      );
  }

  /**
   * 셰이더 프로그램을 로드하고 주소를 반환합니다.
   * @param vertexShaderSource    정점 셰이더 소스
   * @param fragmentShaderSource  프래그먼트 셰이더 소스
   * @return 셰이더 프로그램 주소
   */
  public loadShaderProgram(
    vertexShaderSource: string,
    fragmentShaderSource: string
  ): WebGLProgram {
    // Create Shader Program
    let shaderProgram: WebGLProgram = this.gl.createProgram();

    let vertShader = this.compileShaderSource(
      this.gl.VERTEX_SHADER,
      vertexShaderSource
    );

    if (!vertShader) {
      CubismLogError('Vertex shader compile error!');
      return 0;
    }

    let fragShader = this.compileShaderSource(
      this.gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );
    if (!fragShader) {
      CubismLogError('Vertex shader compile error!');
      return 0;
    }

    // Attach vertex shader to program
    this.gl.attachShader(shaderProgram, vertShader);

    // Attach fragment shader to program
    this.gl.attachShader(shaderProgram, fragShader);

    // link program
    this.gl.linkProgram(shaderProgram);
    const linkStatus = this.gl.getProgramParameter(
      shaderProgram,
      this.gl.LINK_STATUS
    );

    // 링크에 실패하면 셰이더를 삭제
    if (!linkStatus) {
      CubismLogError('Failed to link program: {0}', shaderProgram);

      this.gl.deleteShader(vertShader);
      vertShader = 0;

      this.gl.deleteShader(fragShader);
      fragShader = 0;

      if (shaderProgram) {
        this.gl.deleteProgram(shaderProgram);
        shaderProgram = 0;
      }

      return 0;
    }

    // Release vertex and fragment shaders.
    this.gl.deleteShader(vertShader);
    this.gl.deleteShader(fragShader);

    return shaderProgram;
  }

  /**
   * 셰이더 프로그램을 컴파일합니다.
   * @param shaderType 셰이더 타입(Vertex/Fragment)
   * @param shaderSource 셰이더 소스 코드
   *
   * @return 컴파일된 셰이더 프로그램
   */
  public compileShaderSource(
    shaderType: GLenum,
    shaderSource: string
  ): WebGLProgram {
    const source: string = shaderSource;

    const shader: WebGLProgram = this.gl.createShader(shaderType);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!shader) {
      const log: string = this.gl.getShaderInfoLog(shader);
      CubismLogError('Shader compile log: {0} ', log);
    }

    const status: any = this.gl.getShaderParameter(
      shader,
      this.gl.COMPILE_STATUS
    );
    if (!status) {
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  public setGl(gl: WebGLRenderingContext): void {
    this.gl = gl;
  }

  _shaderSets: csmVector<CubismShaderSet>; // 로드한 셰이더 프로그램을 보관하는 변수
  gl: WebGLRenderingContext; // webgl 컨텍스트
}

/**
 * GLContext마다 CubismShader_WebGL을 확보하기 위한 클래스
 * 싱글톤 클래스이며, CubismShaderManager_WebGL.getInstance에서 접근합니다.
 */
export class CubismShaderManager_WebGL {
  /**
   * 인스턴스를 가져옵니다 (싱글톤).
   * @return 인스턴스
   */
  public static getInstance(): CubismShaderManager_WebGL {
    if (s_instance == null) {
      s_instance = new CubismShaderManager_WebGL();
    }
    return s_instance;
  }

  /**
   * 인스턴스를 해제합니다 (싱글톤).
   */
  public static deleteInstance(): void {
    if (s_instance) {
      s_instance.release();
      s_instance = null;
    }
  }

  /**
   * Private 생성자
   */
  private constructor() {
    this._shaderMap = new csmMap<WebGLRenderingContext, CubismShader_WebGL>();
  }

  /**
   * 소멸자 해당 처리
   */
  public release(): void {
    for (
      const ite: iterator<WebGLRenderingContext, CubismShader_WebGL> =
        this._shaderMap.begin();
      ite.notEqual(this._shaderMap.end());
      ite.preIncrement()
    ) {
      ite.ptr().second.release();
    }
    this._shaderMap.clear();
  }

  /**
   * GLContext를 키로 Shader를 가져옵니다.
   * @param gl
   * @returns
   */
  public getShader(gl: WebGLRenderingContext): CubismShader_WebGL {
    return this._shaderMap.getValue(gl);
  }

  /**
   * GLContext를 등록합니다.
   * @param gl
   */
  public setGlContext(gl: WebGLRenderingContext): void {
    if (!this._shaderMap.isExist(gl)) {
      const instance = new CubismShader_WebGL();
      instance.setGl(gl);
      this._shaderMap.setValue(gl, instance);
    }
  }

  /**
   * GLContext별 Shader를 보관하는 변수
   */
  private _shaderMap: csmMap<WebGLRenderingContext, CubismShader_WebGL>;
}

/**
 * CubismShader_WebGL의 내부 클래스
 */
export class CubismShaderSet {
  shaderProgram: WebGLProgram; // 셰이더 프로그램 주소
  attributePositionLocation: GLuint; // 셰이더 프로그램에 전달할 변수 주소 (Position)
  attributeTexCoordLocation: GLuint; // 셰이더 프로그램에 전달할 변수 주소 (TexCoord)
  uniformMatrixLocation: WebGLUniformLocation; // 셰이더 프로그램에 전달할 변수 주소 (Matrix)
  uniformClipMatrixLocation: WebGLUniformLocation; // 셰이더 프로그램에 전달할 변수 주소 (ClipMatrix)
  samplerTexture0Location: WebGLUniformLocation; // 셰이더 프로그램에 전달할 변수 주소 (Texture0)
  samplerTexture1Location: WebGLUniformLocation; // 셰이더 프로그램에 전달할 변수 주소 (Texture1)
  uniformBaseColorLocation: WebGLUniformLocation; // 셰이더 프로그램에 전달할 변수 주소 (BaseColor)
  uniformChannelFlagLocation: WebGLUniformLocation; // 셰이더 프로그램에 전달할 변수 주소 (ChannelFlag)
  uniformMultiplyColorLocation: WebGLUniformLocation; // 셰이더 프로그램에 전달할 변수 주소 (MultiplyColor)
  uniformScreenColorLocation: WebGLUniformLocation; // 셰이더 프로그램에 전달할 변수 주소 (ScreenColor)
}

export enum ShaderNames {
  // SetupMask
  ShaderNames_SetupMask,

  // Normal
  ShaderNames_NormalPremultipliedAlpha,
  ShaderNames_NormalMaskedPremultipliedAlpha,
  ShaderNames_NomralMaskedInvertedPremultipliedAlpha,

  // Add
  ShaderNames_AddPremultipliedAlpha,
  ShaderNames_AddMaskedPremultipliedAlpha,
  ShaderNames_AddMaskedPremultipliedAlphaInverted,

  // Mult
  ShaderNames_MultPremultipliedAlpha,
  ShaderNames_MultMaskedPremultipliedAlpha,
  ShaderNames_MultMaskedPremultipliedAlphaInverted
}

export const vertexShaderSrcSetupMask =
  'attribute vec4     a_position;' +
  'attribute vec2     a_texCoord;' +
  'varying vec2       v_texCoord;' +
  'varying vec4       v_myPos;' +
  'uniform mat4       u_clipMatrix;' +
  'void main()' +
  '{' +
  '   gl_Position = u_clipMatrix * a_position;' +
  '   v_myPos = u_clipMatrix * a_position;' +
  '   v_texCoord = a_texCoord;' +
  '   v_texCoord.y = 1.0 - v_texCoord.y;' +
  '}';

export const fragmentShaderSrcsetupMask =
  'precision mediump float;' +
  'varying vec2       v_texCoord;' +
  'varying vec4       v_myPos;' +
  'uniform vec4       u_baseColor;' +
  'uniform vec4       u_channelFlag;' +
  'uniform sampler2D  s_texture0;' +
  'void main()' +
  '{' +
  '   float isInside = ' +
  '       step(u_baseColor.x, v_myPos.x/v_myPos.w)' +
  '       * step(u_baseColor.y, v_myPos.y/v_myPos.w)' +
  '       * step(v_myPos.x/v_myPos.w, u_baseColor.z)' +
  '       * step(v_myPos.y/v_myPos.w, u_baseColor.w);' +
  '   gl_FragColor = u_channelFlag * texture2D(s_texture0, v_texCoord).a * isInside;' +
  '}';

//----- 정점 셰이더 프로그램 -----
// Normal & Add & Mult 공통
export const vertexShaderSrc =
  'attribute vec4     a_position;' + //v.vertex
  'attribute vec2     a_texCoord;' + //v.texcoord
  'varying vec2       v_texCoord;' + //v2f.texcoord
  'uniform mat4       u_matrix;' +
  'void main()' +
  '{' +
  '   gl_Position = u_matrix * a_position;' +
  '   v_texCoord = a_texCoord;' +
  '   v_texCoord.y = 1.0 - v_texCoord.y;' +
  '}';

// Normal & Add & Mult 공통 (클리핑된 것 그리기용)
export const vertexShaderSrcMasked =
  'attribute vec4     a_position;' +
  'attribute vec2     a_texCoord;' +
  'varying vec2       v_texCoord;' +
  'varying vec4       v_clipPos;' +
  'uniform mat4       u_matrix;' +
  'uniform mat4       u_clipMatrix;' +
  'void main()' +
  '{' +
  '   gl_Position = u_matrix * a_position;' +
  '   v_clipPos = u_clipMatrix * a_position;' +
  '   v_texCoord = a_texCoord;' +
  '   v_texCoord.y = 1.0 - v_texCoord.y;' +
  '}';

//----- 프래그먼트 셰이더 프로그램 -----
// Normal & Add & Mult 공통 (PremultipliedAlpha)
export const fragmentShaderSrcPremultipliedAlpha =
  'precision mediump float;' +
  'varying vec2       v_texCoord;' + //v2f.texcoord
  'uniform vec4       u_baseColor;' +
  'uniform sampler2D  s_texture0;' + //_MainTex
  'uniform vec4       u_multiplyColor;' +
  'uniform vec4       u_screenColor;' +
  'void main()' +
  '{' +
  '   vec4 texColor = texture2D(s_texture0, v_texCoord);' +
  '   texColor.rgb = texColor.rgb * u_multiplyColor.rgb;' +
  '   texColor.rgb = (texColor.rgb + u_screenColor.rgb * texColor.a) - (texColor.rgb * u_screenColor.rgb);' +
  '   vec4 color = texColor * u_baseColor;' +
  '   gl_FragColor = vec4(color.rgb, color.a);' +
  '}';

// Normal (클리핑된 것 그리기용, PremultipliedAlpha 겸용)
export const fragmentShaderSrcMaskPremultipliedAlpha =
  'precision mediump float;' +
  'varying vec2       v_texCoord;' +
  'varying vec4       v_clipPos;' +
  'uniform vec4       u_baseColor;' +
  'uniform vec4       u_channelFlag;' +
  'uniform sampler2D  s_texture0;' +
  'uniform sampler2D  s_texture1;' +
  'uniform vec4       u_multiplyColor;' +
  'uniform vec4       u_screenColor;' +
  'void main()' +
  '{' +
  '   vec4 texColor = texture2D(s_texture0, v_texCoord);' +
  '   texColor.rgb = texColor.rgb * u_multiplyColor.rgb;' +
  '   texColor.rgb = (texColor.rgb + u_screenColor.rgb * texColor.a) - (texColor.rgb * u_screenColor.rgb);' +
  '   vec4 col_formask = texColor * u_baseColor;' +
  '   vec4 clipMask = (1.0 - texture2D(s_texture1, v_clipPos.xy / v_clipPos.w)) * u_channelFlag;' +
  '   float maskVal = clipMask.r + clipMask.g + clipMask.b + clipMask.a;' +
  '   col_formask = col_formask * maskVal;' +
  '   gl_FragColor = col_formask;' +
  '}';

// Normal & Add & Mult 공통 (클리핑되어 반전 사용 그리기용, PremultipliedAlpha의 경우)
export const fragmentShaderSrcMaskInvertedPremultipliedAlpha =
  'precision mediump float;' +
  'varying vec2      v_texCoord;' +
  'varying vec4      v_clipPos;' +
  'uniform sampler2D s_texture0;' +
  'uniform sampler2D s_texture1;' +
  'uniform vec4      u_channelFlag;' +
  'uniform vec4      u_baseColor;' +
  'uniform vec4      u_multiplyColor;' +
  'uniform vec4      u_screenColor;' +
  'void main()' +
  '{' +
  '   vec4 texColor = texture2D(s_texture0, v_texCoord);' +
  '   texColor.rgb = texColor.rgb * u_multiplyColor.rgb;' +
  '   texColor.rgb = (texColor.rgb + u_screenColor.rgb * texColor.a) - (texColor.rgb * u_screenColor.rgb);' +
  '   vec4 col_formask = texColor * u_baseColor;' +
  '   vec4 clipMask = (1.0 - texture2D(s_texture1, v_clipPos.xy / v_clipPos.w)) * u_channelFlag;' +
  '   float maskVal = clipMask.r + clipMask.g + clipMask.b + clipMask.a;' +
  '   col_formask = col_formask * (1.0 - maskVal);' +
  '   gl_FragColor = col_formask;' +
  '}';

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismshader_webgl';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismShaderSet = $.CubismShaderSet;
  export type CubismShaderSet = $.CubismShaderSet;
  export const CubismShader_WebGL = $.CubismShader_WebGL;
  export type CubismShader_WebGL = $.CubismShader_WebGL;
  export const CubismShaderManager_WebGL = $.CubismShaderManager_WebGL;
  export type CubismShaderManager_WebGL = $.CubismShaderManager_WebGL;
  export const ShaderNames = $.ShaderNames;
  export type ShaderNames = $.ShaderNames;
}