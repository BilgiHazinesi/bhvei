#!/bin/bash
# Read renderHistory fully
sed -n '392,434p' kutuphane/kutuphane.js
# Read openBookDetail fully
sed -n '469,493p' kutuphane/kutuphane.js
# Read analyzeData and renderBookManager lines we need
sed -n '190,208p' kutuphane/kutuphane.js
