from loguru import logger
import sys
import os

logger.add("api.log", rotation="5 MB", level="INFO", backtrace=True, diagnose=True)
logger.add(sys.stdout, level="DEBUG")

