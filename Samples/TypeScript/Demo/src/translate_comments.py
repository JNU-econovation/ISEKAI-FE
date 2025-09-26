# translate_comments.py (일본어, 영어 자동 감지 최종 버전)

import os
from deep_translator import GoogleTranslator
import time

# ------------------- 설정 -------------------
TARGET_EXTENSIONS = ['.js', '.ts', '.html', '.css', '.json', 'md']
EXCLUDE_DIRS = ['node_modules', 'dist', 'venv', '.git']
EXCLUDE_FILES = ['translate_comments.py']
# -------------------------------------------

# 번역기 객체 생성 (소스: 자동감지, 타겟: 한국어)
translator = GoogleTranslator(source='auto', target='ko')

def translate_line(line):
    """한 줄의 코드에서 주석 부분을 찾아 번역합니다."""
    # 공백 제거 후 주석 기호(//, /*, *)로 시작하는지 확인
    stripped_line = line.strip()
    is_comment = stripped_line.startswith('//') or \
                 stripped_line.startswith('/*') or \
                 stripped_line.startswith('*') or \
                 stripped_line.endswith('*/')

    if not is_comment:
        return line # 주석이 아니면 원본 그대로 반환

    try:
        # 번역 API의 과도한 호출을 막기 위해 약간의 딜레이 추가
        time.sleep(0.1)
        translated_text = translator.translate(stripped_line)

        # 원본 들여쓰기 유지
        indentation = line[:len(line) - len(line.lstrip())]
        
        if translated_text:
            return f"{indentation}{translated_text}\n"
        else:
            return line # 번역 실패 시 원본 유지

    except Exception as e:
        print(f"⚠️  번역 오류 발생 (원본 유지): {stripped_line} | 오류: {e}")
        return line

def process_file(file_path):
    """파일을 한 줄씩 읽어 주석을 번역하고 다시 저장합니다."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        print(f"⏳  번역 중...: {file_path}")
        translated_lines = [translate_line(line) for line in lines]

        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(translated_lines)
            
        print(f"✅  번역 완료: {file_path}")

    except Exception as e:
        print(f"❌  파일 처리 실패: {file_path} | 오류: {e}")


if __name__ == "__main__":
    project_root = os.getcwd()
    print("🚀  주석 번역 스크립트를 시작합니다. (일본어/영어 -> 한국어)")
    print(f"프로젝트 경로: {project_root}\n")

    for root, dirs, files in os.walk(project_root, topdown=True):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

        for file in files:
            if file in EXCLUDE_FILES or not any(file.endswith(ext) for ext in TARGET_EXTENSIONS):
                continue
            
            file_path = os.path.join(root, file)
            process_file(file_path)
            
    print("\n🎉  모든 작업이 완료되었습니다!")