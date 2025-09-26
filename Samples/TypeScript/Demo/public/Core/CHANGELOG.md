# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).


## 2025-04-24

### Added

*`csmgetParameterRepeats '함수를 추가하십시오.
  *이 함수는 매개 변수가 반복되도록 설정되어 있는지 검색합니다.

### Changed

* 코어 버전을 05.01.0000으로 업그레이드하십시오.

### Fixed

* DLL의 'CSMGETPARAMETERKEYCOUNTS () 및`CSMGETPARAMETERKEYVALUES ()`기호를 수정하십시오.


## 2024-12-19

### Removed

* [기본] Visual Studio 2013 (MSVC 120) 정적 라이브러리를 제거하십시오.


## 2024-11-07

### Added

* [기본] Linux 용 실험 지원`ARM64` 라이브러리를 추가하십시오.

### Removed

* [Unity, Native, Java] Android Arm V7 라이브러리를 제거하십시오.


## 2024-04-04

### Added

* [Unity] Harmonyos 빌드에 라이브러리 (.SO)를 추가하십시오.


## 2024-03-26

### Remove

* [Unity] Emscripten 1.38.48로 제작 된 제거.
 * Unity 2021.2 이상은`assets/live2d/cubism/plugins/emscripten/little`에서 핵심 만 사용합니다.


## 2023-09-28

### Remove

* iOS 빌드에서 비트 코드를 제거하십시오.


## 2023-08-17

### Added

* 블렌드 모양 기능을 향상시킵니다.
  * [여기] (https://docs.live2d.com/en/cubism-editor-manual/blend-shape/)을 참조하십시오.

### Changed

* 코어 버전을 05.00.0000으로 업그레이드하십시오.


## 2023-05-09

### Changed

* Linux 용 라이브러리의 GCC 버전을 6.5.0에서 8.3.0으로 변경하십시오.


## 2023-03-16

### Fixed

* 마스크의 드로잉 객체의 인덱스가`csmgetDrawableMasks ()`에 대한 음수 값인 경우를 수정하십시오.
* MOC3 파일이 올바른 형식이지만`csmhasmoconsistency ()`가 0으로 반환 된 문제를 해결하십시오.
  *이 문제는 일부 모델에서 BlendShape 중량 제한 설정을 사용하여 발생했습니다.
* 올바른 형식이 아닌 MOC3 파일에`csmhasmocnocnesistency ()`가로드 된 경우 충돌을 일으킬 수있는 문제를 해결하십시오.

### Changed

* 코어 버전을 04.02.0004로 업그레이드하십시오.


## 2023-03-10

### Added

*`csmhasmoconsistency '함수를 추가하십시오.
  *이 기능은`moc3 '파일이 유효한지 확인합니다.

### Changed

* 코어 버전을 04.02.0003으로 업그레이드하십시오.


## 2023-02-21

### Added

* [Web]은`memory '와 관련된 클래스를 추가했습니다.
  * 초기화시 메모리의 양을 조정하려면 funciton`teaterizeamountofMemory ()`를 추가하십시오.


## 2022-10-28

### Fixed

* [Java] 불필요한 방법을 제거하십시오.


## 2022-10-06

### Added

* [Java] Android 용 AAR 파일을 추가하십시오.


## 2022-09-08

### Added

* 다국어 지원 문서를 추가하십시오.
* Visual Studio 2022 지원.


## 2022-08-04

### Fixed

* [웹] 수정`csmgetMocversion` 기능 인수.


## 2022-07-07

### Added

* 함수 추가
  *`CSMGETPARAMETERTYPES '
  *`csmgetDrawableParentPartIndices '

*`csmmovversion`와 enum 유형을 추가하십시오. 이 유형은`csmgetMocversion`,`csmgetLatestMocversion`의 반환 값입니다.

### Changed

* 코어 버전을 04.02.0002로 업그레이드하십시오.


## 2022-06-02

### Changed

* 코어 버전을 04.02.0001로 업그레이드하십시오.

### Fixed

* 적용 할 다른 객체의 색상 / 화면 색상을 곱한 버그를 수정했습니다.


## 2022-05-19

### Added

* 새로운 곱하기 색상 / 화면 색상 기능을 지원합니다.
* 새로운 블렌드 모양 기능을 지원합니다.

### Changed

* 코어 버전을 04.02.0000으로 업그레이드하십시오. 이 업그레이드는 Cubism Editor 4.2 기능을 따르고 있습니다.


## 2022-02-10

### Added

* [Unity] emscripten 최신 버전 빌드에 비트 코드 라이브러리 (.BC)를 추가하십시오.

### Changed

* [Unity] 비트 코드 파일 디렉토리 위치를 변경하십시오.
  * emsdk 최신 버전 '최신'디렉토리의 비트 코드 파일 빌드.
  * EMSDK 1.38.48`1_38_48` 디렉토리의 비트 코드 파일 빌드.


## 2021-12-09

### Added

* Mac 촉매에 대한 정적 라이브러리 (.a)를 추가하십시오.


## 2021-10-07

### Added

* Android 용`x86_64` 라이브러리를 추가하십시오.
* MACOS 용`ARM64` 라이브러리를 추가하십시오.


## 2021-03-09

### Added

* 시청자를위한 펀 트치를 추가하십시오.
  *`csmgetParameterKeyCounts`
  *`csmget parameterKeyValues`


### Changed

* 코어 버전을`04.01.0000`으로 업데이트하십시오.


## 2020-01-30

### Added

* 정적으로 연결되는 DLL을 위해 정적 라이브러리 (.lib)를 추가하십시오.
* Windows Dynamic Library (DLL) 용 기호 파일을 추가하십시오.


## 2019-11-19

### Fixed

* Windows (.lib)의 정적 라이브러리 링크를 수정합니다.


## 2019-11-14

### Added

* Visual Studio 2019를 지원합니다.
* MACOS Dynamic Library (Dylib)를 지원합니다.

### Changed

* Windows Dynamic Library 업데이트 : 건물에 Visual Studio 2019를 사용하십시오.

### Security

* MACOS 공유 라이브러리에 대한 번들 인증서 및 공증인 티켓.


## 2019-09-04

### Added

* 새로운 거꾸로 된 마스킹 기능을 지원합니다.
* Universal Windows 플랫폼 용 ARM64 아키텍처를 지원합니다.

### Changed

* 코어 버전을 04.00.0000 (67108864)으로 업그레이드하십시오. 이 업그레이드는 Cubism Editor 4.0 기능을 따르고 있습니다.
* * windows/x86 dll *에 대한 통화 규칙을 추가하십시오.

### Removed

* 입체파 바인딩의 현탁으로 인해 비트 코드 바이너리를 제거하십시오. *


## 2019-04-09

### Added

* Windows 스토어 애플리케이션을위한 Universal Windows 플랫폼을 지원합니다.


## 2019-01-31

### Added

* 지정된 부품의 부모 부분을 얻으려면 API를 추가하십시오.
* MOC3 버전을 얻으려면 API를 추가하십시오.


## 2018-12-20

### Added

* [Native] 새로운 기능 추가 :`CSMGETPARTPARENTPARTINDICES '.
* [Native, 3.3 지원] 새로운 Warp Deformer 기능을 지원합니다.

### Changed

* 코어 버전을 03.03.0000 (50528256)으로 업그레이드하십시오. 이 업그레이드는 Cubism Editor 3.3 기능을 따르고 있습니다.


## 2018-08-22

### Added

* [네이티브] 네온에 대한 지원을 추가하십시오.


## 2018-05-14

### Added

*[기본] Windows 추가 ** Visual C ++ 2013 ** 라이브러리.
* [Wind
* [iOS] iPhone Simulator SDK에 대한 지원을 추가합니다.

### Fixed

* Android`ARM64-V8A`의 라이브러리를 연결할 때 오류가 발생했습니다.


## 2017-11-17

### Fixed

* 정점 지수의 처리를 수정하십시오.


## 2017-10-05

### Added

* iOS에 비트 코드를 제공합니다.


## 2017-08-09

### Added

* [기본] Android * ARM64-V8A * ABI 라이브러리 추가.

### Fixed

* 특정 시나리오에서 도면 순서를 수정하십시오.


## 2017-07-12

### Added

* EMScripten에 대한 실험 지원을 추가하십시오.
*`changelog.md`를 추가하십시오.

### Fixed

* 특정 시나리오에서 액세스 위반을 수정하십시오.
* 특정 시나리오에서 업데이트 결과를 수정하십시오.


## 2017-05-02

### Added

* [네이티브] 라즈베리 파이에 대한 실험 지원을 추가하십시오.
*`readme.md`를 추가하십시오.
