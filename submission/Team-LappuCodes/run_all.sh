#!/bin/bash
set -e
python step0_generate_data.py
python m1_quantify_noise.py     | tee outputs/m1.txt
python m2_noise_pattern.py      | tee outputs/m2.txt
python m3_accuracy_ceiling.py   | tee outputs/m3.txt
python m4_find_bad_labels.py    | tee outputs/m4.txt
python m5_robust_training.py    | tee outputs/m5.txt
