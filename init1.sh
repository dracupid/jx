#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# config variables
N_NODE_MIRROR='http://mirrors.tencent.com/nodejs-release/'
N_REVISION='0af211c189be5820ea972a116aeb9e8eb9d6280b'
NODE_VERSION='21.6.1'
# -- end --

__dirname=$(dirname $(realpath $BASH_SOURCE))
cd ${__dirname}

INSTALL_DIR="$HOME/.jx"
BIN_DIR="${INSTALL_DIR}/bin"
CACHE_DIR="${INSTALL_DIR}/.cache"

export PATH="${BIN_DIR}:${PATH}"

mkdir -p ${BIN_DIR}

download() {
  if command -v curl &>/dev/null; then
    curl -fsSL $1 >$2
  elif command -v wget &>/dev/null; then
    wget -q -O- $1 >$2
  else
    echo "curl or wget command required"
    exit 1
  fi
}

prepare_n() {
  N_BIN="${BIN_DIR}/n"
  if [ -e "${N_BIN}" ]; then
    return
  fi
  download "https://raw.githubusercontent.com/tj/n/$1/bin/n" "${N_BIN}"
  chmod u+x $N_BIN
}

prepare_node() {
  export N_PREFIX="${CACHE_DIR}/n"
  export N_NODE_MIRROR=$N_NODE_MIRROR
  n $1 --download
  NODE_ROOT="${N_PREFIX}/n/versions/node/$1"
  cp -r ${NODE_ROOT}/bin/node ${BIN_DIR}
  ${NODE_ROOT}/bin/npm install pnpm@8 -g --silent
}

prepare_n $N_REVISION
prepare_node $NODE_VERSION

pnpm install

echo ""
echo ">> Congratulations! jx has been install to ${INSTALL_DIR}."
