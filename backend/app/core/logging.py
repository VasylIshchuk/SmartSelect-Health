import sys

from loguru import logger
from .config import settings


logger.add(
    settings.LOG_PATH, rotation="5 MB", level="INFO", backtrace=True, diagnose=True
)
logger.add(sys.stdout, level="DEBUG")
