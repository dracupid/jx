#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# modified by https://bun.sh/install, no windows support

# config variables
NPM_REGISTRY=${NPM_REGISTRY-"http://mirrors.cloud.tencent.com/npm/"}
BUN_VERSION=${BUN_VERSION-"1.1.13"}
# -- end --

__dirname=$(dirname $(realpath $BASH_SOURCE))
cd ${__dirname}

INSTALL_DIR="$HOME/.jx"
BIN_DIR="${INSTALL_DIR}/bin"
CACHE_DIR="${INSTALL_DIR}/.cache"

mkdir -p $BIN_DIR

export PATH="${BIN_DIR}:${PATH}"

jx_download() {
  if command -v curl &>/dev/null; then
    curl -fSL $1 >$2
  elif command -v wget &>/dev/null; then
    wget -O- $1 >$2
  else
    echo "curl or wget command required"
    exit 1
  fi
}

bun_target() {
  local target=linux-x64

  case $(uname -ms) in
  'Darwin x86_64')
    target=darwin-x64
    ;;
  'Darwin arm64')
    target=darwin-aarch64
    ;;
  'Linux aarch64' | 'Linux arm64')
    target=linux-aarch64
    ;;
  'Linux x86_64' | *)
    target=linux-x64
    ;;
  esac

  if [[ $target = darwin-x64 ]]; then
    # If AVX2 isn't supported, use the -baseline build
    if [[ $(sysctl -a | grep machdep.cpu | grep AVX2) == '' ]]; then
      target=darwin-x64-baseline
    fi
  fi

  if [[ $target = linux-x64 ]]; then
    # If AVX2 isn't supported, use the -baseline build
    if [[ $(cat /proc/cpuinfo | grep avx2) = '' ]]; then
      target=linux-x64-baseline
    fi
  fi

  echo $target
}

prepare_bun() {
  local target=$(bun_target)

  local BUN_INSTALL="${HOME}/.jx/bun"
  local NPM_PKG_ROOT="${BUN_INSTALL}/package"
  local BIN_PATH_IN_PACKAGE="package/bin/bun"

  local BUN_NAME="bun-${target}-${BUN_VERSION}"
  local BUN_URL="${NPM_REGISTRY}@oven/bun-${target}/-/${BUN_NAME}.tgz"
  local BUN_DIR="${BUN_INSTALL}/${BUN_NAME}"
  local BUN_TAR="${BUN_DIR}.tgz"

  echo "install bun at ${BUN_DIR}"

  mkdir -p $BUN_DIR

  if [ ! -f "${BUN_DIR}/${BIN_PATH_IN_PACKAGE}" ]; then
    if [ ! -f "$BUN_TAR" ]; then
      jx_download $BUN_URL $BUN_TAR
    fi

    tar zxf $BUN_TAR -C $BUN_DIR $BIN_PATH_IN_PACKAGE
    rm $BUN_TAR
  fi

  cat <<EOF >${BIN_DIR}/bun
#!/usr/bin/env bash
set -euo pipefail

export BUN_INSTALL=${BUN_INSTALL}
exec ${BUN_DIR}/${BIN_PATH_IN_PACKAGE} "\$@"
EOF

  chmod u+x ${BIN_DIR}/bun

  cat <<EOF >$HOME/.bunfig.toml
[install]
registry = "${NPM_REGISTRY}"
EOF
}

prepare_jx() {
  ln -sf ${__dirname}/bin/jx $BIN_DIR/jx
  bun install --frozen-lockfile -p
}

prepare_bun
prepare_jx

echo ""
echo ">> Congratulations! jx has been install to ${INSTALL_DIR}."
