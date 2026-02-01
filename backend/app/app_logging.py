import sys
import os

from loguru import logger

script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)

LOG_PATH = os.path.join(backend_dir, "api.log")

logger.add(LOG_PATH, rotation="5 MB", level="INFO", backtrace=True, diagnose=True)
logger.add(sys.stdout, level="DEBUG")
