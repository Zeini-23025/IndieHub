#!/bin/bash

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
DESKTOP_DIR="$ROOT_DIR/desktop"

# ── Colors ───────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

log()  { echo -e "${GREEN}[✔]${RESET} $1"; }
warn() { echo -e "${YELLOW}[!]${RESET} $1"; }
info() { echo -e "${CYAN}[→]${RESET} $1"; }
err()  { echo -e "${RED}[✘]${RESET} $1"; }

# ══════════════════════════════════════════════════════════════
#  COMBINED
# ══════════════════════════════════════════════════════════════
run_web() {
  trap "echo -e '\n${YELLOW}Stopping servers...${RESET}'; kill 0" SIGINT
  log "Starting Backend..."; (cd "$BACKEND_DIR" && python manage.py runserver) &
  log "Starting Frontend..."; (cd "$FRONTEND_DIR" && npm run dev) &
  wait
}

run_all() {
  trap "echo -e '\n${YELLOW}Stopping all servers...${RESET}'; kill 0" SIGINT
  log "Starting Backend...";          (cd "$BACKEND_DIR" && python manage.py runserver) &
  log "Starting Frontend...";         (cd "$FRONTEND_DIR" && npm run dev) &
  log "Starting Desktop (Electron)..."; (cd "$DESKTOP_DIR" && npm run dev) &
  wait
}

run_test() {
  info "Running Backend tests...";  (cd "$BACKEND_DIR" && python manage.py test)
  echo ""
  info "Running Frontend tests..."; (cd "$FRONTEND_DIR" && npm test)
  echo ""
  warn "Desktop has no tests — it shares the Frontend build."
  echo ""; log "All tests done."
}

install_all() {
  info "Installing Backend dependencies...";  (cd "$BACKEND_DIR" && pip install -r requirements.txt)
  echo ""
  info "Installing Frontend dependencies..."; (cd "$FRONTEND_DIR" && npm install)
  echo ""
  info "Installing Desktop dependencies...";  (cd "$DESKTOP_DIR" && npm install)
  echo ""; log "All dependencies installed."
}

# ══════════════════════════════════════════════════════════════
#  BACKEND
# ══════════════════════════════════════════════════════════════
b_run()          { info "Backend: runserver";        (cd "$BACKEND_DIR" && python manage.py runserver); }
b_migrate()      { info "Backend: migrate";          (cd "$BACKEND_DIR" && python manage.py migrate); }
b_makemigrate()  { info "Backend: makemigrations";   (cd "$BACKEND_DIR" && python manage.py makemigrations); }
b_test()         { info "Backend: test";             (cd "$BACKEND_DIR" && python manage.py test); }
b_superuser()    { info "Backend: createsuperuser";  (cd "$BACKEND_DIR" && python manage.py createsuperuser); }
b_install()      { info "Backend: pip install";      (cd "$BACKEND_DIR" && pip install -r requirements.txt); }
b_deletedb() {
  DB="$BACKEND_DIR/db.sqlite3"
  if [ -f "$DB" ]; then
    warn "Deleting $DB ..."
    rm "$DB" && log "Database deleted."
  else
    warn "No db.sqlite3 found."
  fi
}

# ══════════════════════════════════════════════════════════════
#  FRONTEND
# ══════════════════════════════════════════════════════════════
f_run()     { info "Frontend: dev";     (cd "$FRONTEND_DIR" && npm run dev); }
f_test()    { info "Frontend: test";    (cd "$FRONTEND_DIR" && npm test); }
f_install() { info "Frontend: install"; (cd "$FRONTEND_DIR" && npm install); }
f_build()   { info "Frontend: build";   (cd "$FRONTEND_DIR" && npm run build); }
f_lint()    { info "Frontend: lint";    (cd "$FRONTEND_DIR" && npm run lint); }

# ══════════════════════════════════════════════════════════════
#  DESKTOP
# ══════════════════════════════════════════════════════════════
d_run()     { info "Desktop: dev (Electron)"; (cd "$DESKTOP_DIR" && npm run dev); }
d_install() { info "Desktop: install";        (cd "$DESKTOP_DIR" && npm install); }
d_build()   { info "Desktop: build";          (cd "$DESKTOP_DIR" && npm run build); }

# ══════════════════════════════════════════════════════════════
#  MENU
# ══════════════════════════════════════════════════════════════
show_menu() {
  clear
  echo -e "${BOLD}${CYAN}"
  echo "  ╔══════════════════════════════╗"
  echo "  ║     IndieHub Dev Console     ║"
  echo "  ╚══════════════════════════════╝"
  echo -e "${RESET}"
  echo -e "  ${BOLD}Combined${RESET}"
  echo "    1)  Run     — Backend + Frontend"
  echo "    2)  Run     — Backend + Frontend + Desktop"
  echo "    3)  Test    — Backend + Frontend"
  echo "    4)  Install — All dependencies"
  echo ""
  echo -e "  ${BOLD}Backend${RESET}"
  echo "    b1) Run server          b5) Create superuser"
  echo "    b2) Migrate             b6) pip install"
  echo "    b3) Make migrations     b7) Delete SQLite DB"
  echo "    b4) Test"
  echo ""
  echo -e "  ${BOLD}Frontend${RESET}"
  echo "    f1) Run    f2) Test    f3) Install    f4) Build    f5) Lint"
  echo ""
  echo -e "  ${BOLD}Desktop${RESET}"
  echo "    d1) Run    d2) Install    d3) Build"
  echo -e "    ${YELLOW}(no tests — Desktop shares Frontend build)${RESET}"
  echo ""
  echo -e "    q)  Quit"
  echo ""
  echo -ne "${CYAN}  Choose > ${RESET}"
  read -r choice

  case $choice in
    1) run_web ;;       2) run_all ;;      3) run_test ;;     4) install_all ;;
    b1) b_run ;;        b2) b_migrate ;;   b3) b_makemigrate ;; b4) b_test ;;
    b5) b_superuser ;;  b6) b_install ;;   b7) b_deletedb ;;
    f1) f_run ;;        f2) f_test ;;      f3) f_install ;;   f4) f_build ;;  f5) f_lint ;;
    d1) d_run ;;        d2) d_install ;;   d3) d_build ;;
    q|Q) echo "Bye!"; exit 0 ;;
    *) warn "Unknown option. Try again."; sleep 1 ;;
  esac

  echo -e "\n${YELLOW}Press Enter to return to menu...${RESET}"
  read -r
  show_menu
}

# ══════════════════════════════════════════════════════════════
#  CLI  ./dev.sh [option]
# ══════════════════════════════════════════════════════════════
case "${1:-}" in
  # Combined
  web)     run_web ;;
  all)     run_all ;;
  test)    run_test ;;
  setup)   install_all ;;
  # Backend
  b:run)   b_run ;;
  migrate) b_migrate ;;
  mm)      b_makemigrate ;;
  b:test)  b_test ;;
  su)      b_superuser ;;
  b:install) b_install ;;
  deletedb)  b_deletedb ;;
  # Frontend
  f:run)   f_run ;;
  f:test)  f_test ;;
  f:install) f_install ;;
  f:build) f_build ;;
  f:lint)  f_lint ;;
  # Desktop
  d:run)   d_run ;;
  d:install) d_install ;;
  d:build) d_build ;;
  # Help
  help|-h|--help)
    echo -e "${BOLD}Usage:${RESET} ./dev.sh [option]   (no option → interactive menu)"
    echo ""
    echo -e "  ${CYAN}web${RESET}         Run Backend + Frontend"
    echo -e "  ${CYAN}all${RESET}         Run Backend + Frontend + Desktop"
    echo -e "  ${CYAN}test${RESET}        Test Backend + Frontend"
    echo -e "  ${CYAN}setup${RESET}       Install all dependencies"
    echo ""
    echo -e "  ${CYAN}b:run${RESET}       python manage.py runserver"
    echo -e "  ${CYAN}migrate${RESET}     python manage.py migrate"
    echo -e "  ${CYAN}mm${RESET}          python manage.py makemigrations"
    echo -e "  ${CYAN}b:test${RESET}      python manage.py test"
    echo -e "  ${CYAN}su${RESET}          python manage.py createsuperuser"
    echo -e "  ${CYAN}b:install${RESET}   pip install -r requirements.txt"
    echo -e "  ${CYAN}deletedb${RESET}    Delete db.sqlite3"
    echo ""
    echo -e "  ${CYAN}f:run${RESET}       Frontend npm run dev"
    echo -e "  ${CYAN}f:test${RESET}      Frontend npm test"
    echo -e "  ${CYAN}f:install${RESET}   Frontend npm install"
    echo -e "  ${CYAN}f:build${RESET}     Frontend npm run build"
    echo -e "  ${CYAN}f:lint${RESET}      Frontend npm run lint"
    echo ""
    echo -e "  ${CYAN}d:run${RESET}       Desktop npm run dev (Electron)"
    echo -e "  ${CYAN}d:install${RESET}   Desktop npm install"
    echo -e "  ${CYAN}d:build${RESET}     Desktop npm run build"
    echo -e "  ${YELLOW}  (Desktop has no tests)${RESET}"
    ;;
  # No argument → menu
  "") show_menu ;;
  *) err "Unknown option: $1"; echo "Run './dev.sh help' to see all options."; exit 1 ;;
esac