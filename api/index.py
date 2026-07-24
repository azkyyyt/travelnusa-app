import sys
import os

# Tambahkan direktori utama project ke sys.path agar module main & backend dapat diimport
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
