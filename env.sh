#!/bin/sh

JX_ROOT="$HOME/.jx"

BIN_DIR="$JX_ROOT/bin"
BINS_DIR="$JX_ROOT/bins"

JS_PATH=$BIN_DIR

for sub_bin in "$BINS_DIR/*/";
do
  sub_bin=$(realpath $sub_bin)
  JS_PATH=$sub_bin:$JS_PATH
done

export PATH="$JS_PATH:$PATH"

# TODO: no hardcode
export RUSTUP_HOME="$JX_ROOT/rust/rustup"
export CARGO_HOME="$JX_ROOT/rust/cargo"
