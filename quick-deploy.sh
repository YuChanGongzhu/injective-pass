#!/bin/bash

# Injective Pass - 快速部署脚本
# 使用方法: ./quick-deploy.sh [环境]
# 环境选项: dev (开发) | prod (生产) | all (全部)

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    cat << EOF
Injective Pass 快速部署脚本

使用方法:
    ./quick-deploy.sh [环境]

环境选项:
    dev     - 开发环境 (前端: localhost:3000, 后端: localhost:3001)
    prod    - 生产环境 (Docker容器化部署)
    all     - 开发+生产环境

示例:
    ./quick-deploy.sh dev      # 启动开发环境
    ./quick-deploy.sh prod     # 启动生产环境
    ./quick-deploy.sh all      # 同时启动两种环境

无参数时默认启动开发环境。

EOF
}

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js 版本过低 (当前: $(node -v))，需要 18+"
        exit 1
    fi
    
    # 检查 Docker (生产环境需要)
    if [ "$ENVIRONMENT" = "prod" ] || [ "$ENVIRONMENT" = "all" ]; then
        if ! command -v docker &> /dev/null; then
            log_error "Docker 未安装，生产环境需要 Docker"
            exit 1
        fi
        
        if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
            log_error "Docker Compose 未安装"
            exit 1
        fi
    fi
    
    # 检查 Python (开发环境前端服务器)
    if [ "$ENVIRONMENT" = "dev" ] || [ "$ENVIRONMENT" = "all" ]; then
        if ! command -v python3 &> /dev/null; then
            log_error "Python3 未安装，开发环境需要 Python3"
            exit 1
        fi
    fi
    
    log_success "依赖检查完成"
}

# 设置环境变量
setup_environment() {
    log_info "设置环境变量..."
    
    # 后端目录
    BACKEND_DIR="./nfc-wallet-backend"
    FRONTEND_DIR="./front-end"
    
    # 检查目录是否存在
    if [ ! -d "$BACKEND_DIR" ]; then
        log_error "后端目录不存在: $BACKEND_DIR"
        exit 1
    fi
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        log_error "前端目录不存在: $FRONTEND_DIR"
        exit 1
    fi
    
    # 检查 .env 文件
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        log_warning ".env 文件不存在，从示例文件复制..."
        if [ -f "$BACKEND_DIR/env.example" ]; then
            cp "$BACKEND_DIR/env.example" "$BACKEND_DIR/.env"
            log_info "请编辑 $BACKEND_DIR/.env 文件配置数据库连接"
        else
            log_error "env.example 文件不存在"
            exit 1
        fi
    fi
    
    log_success "环境变量设置完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    # 后端依赖
    cd "$BACKEND_DIR"
    if [ ! -d "node_modules" ]; then
        log_info "安装后端依赖..."
        npm install
    else
        log_info "后端依赖已存在，跳过安装"
    fi
    cd ..
    
    log_success "依赖安装完成"
}

# 启动开发环境
start_dev() {
    log_info "启动开发环境..."
    
    # 检查端口是否被占用
    check_port() {
        local port=$1
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_warning "端口 $port 已被占用"
            return 1
        fi
        return 0
    }
    
    # 启动数据库服务 (如果需要)
    if [ -f "$BACKEND_DIR/docker-compose.yml" ]; then
        log_info "启动数据库服务..."
        cd "$BACKEND_DIR"
        docker compose up -d postgres redis
        sleep 5  # 等待数据库启动
        cd ..
    fi
    
    # 数据库迁移
    log_info "执行数据库迁移..."
    cd "$BACKEND_DIR"
    npx prisma generate
    npx prisma db push
    cd ..
    
    # 启动后端服务
    log_info "启动后端服务 (端口: 3001)..."
    cd "$BACKEND_DIR"
    npm run start:dev &
    BACKEND_PID=$!
    cd ..
    
    # 等待后端启动
    sleep 10
    
    # 启动前端服务
    log_info "启动前端服务 (端口: 3000)..."
    cd "$FRONTEND_DIR"
    python3 -m http.server 3000 &
    FRONTEND_PID=$!
    cd ..
    
    # 创建 PID 文件
    echo "$BACKEND_PID" > .backend.pid
    echo "$FRONTEND_PID" > .frontend.pid
    
    log_success "开发环境启动完成!"
    log_info "前端地址: http://localhost:3000"
    log_info "后端API: http://localhost:3001"
    log_info ""
    log_info "停止服务: ./quick-deploy.sh stop"
}

# 启动生产环境
start_prod() {
    log_info "启动生产环境..."
    
    cd "$BACKEND_DIR"
    
    # 构建和启动服务
    log_info "构建并启动 Docker 容器..."
    docker compose up -d --build
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 15
    
    # 健康检查
    log_info "执行健康检查..."
    for i in {1..30}; do
        if curl -s http://localhost:8080/api/health >/dev/null 2>&1; then
            log_success "后端服务健康检查通过"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "后端服务启动失败"
            docker compose logs api
            exit 1
        fi
        sleep 2
    done
    
    cd ..
    
    log_success "生产环境启动完成!"
    log_info "前端地址: http://localhost:8001"
    log_info "后端API: http://localhost:8080"
    log_info "API文档: http://localhost:8080/api"
}

# 停止服务
stop_services() {
    log_info "停止服务..."
    
    # 停止开发环境
    if [ -f ".backend.pid" ]; then
        BACKEND_PID=$(cat .backend.pid)
        if ps -p $BACKEND_PID > /dev/null; then
            kill $BACKEND_PID
            log_info "后端服务已停止"
        fi
        rm -f .backend.pid
    fi
    
    if [ -f ".frontend.pid" ]; then
        FRONTEND_PID=$(cat .frontend.pid)
        if ps -p $FRONTEND_PID > /dev/null; then
            kill $FRONTEND_PID
            log_info "前端服务已停止"
        fi
        rm -f .frontend.pid
    fi
    
    # 停止生产环境
    if [ -f "$BACKEND_DIR/docker-compose.yml" ]; then
        cd "$BACKEND_DIR"
        docker compose down
        cd ..
        log_info "Docker 容器已停止"
    fi
    
    log_success "所有服务已停止"
}

# 显示状态
show_status() {
    log_info "服务状态检查..."
    
    echo ""
    echo "=== 开发环境 ==="
    
    # 检查开发环境进程
    if [ -f ".backend.pid" ] && ps -p $(cat .backend.pid) > /dev/null; then
        log_success "后端服务: 运行中 (PID: $(cat .backend.pid))"
    else
        log_warning "后端服务: 未运行"
    fi
    
    if [ -f ".frontend.pid" ] && ps -p $(cat .frontend.pid) > /dev/null; then
        log_success "前端服务: 运行中 (PID: $(cat .frontend.pid))"
    else
        log_warning "前端服务: 未运行"
    fi
    
    echo ""
    echo "=== 生产环境 ==="
    
    # 检查 Docker 容器
    if [ -f "$BACKEND_DIR/docker-compose.yml" ]; then
        cd "$BACKEND_DIR"
        if docker compose ps | grep -q "Up"; then
            log_success "Docker 容器: 运行中"
            docker compose ps
        else
            log_warning "Docker 容器: 未运行"
        fi
        cd ..
    fi
    
    echo ""
    echo "=== 端口占用 ==="
    echo "3000: $(lsof -Pi :3000 -sTCP:LISTEN || echo '未占用')"
    echo "3001: $(lsof -Pi :3001 -sTCP:LISTEN || echo '未占用')"
    echo "8080: $(lsof -Pi :8080 -sTCP:LISTEN || echo '未占用')"
    echo "8001: $(lsof -Pi :8001 -sTCP:LISTEN || echo '未占用')"
}

# 主函数
main() {
    echo ""
    echo "🚀 Injective Pass 快速部署脚本"
    echo "=================================="
    
    # 参数解析
    ENVIRONMENT=${1:-dev}
    
    case $ENVIRONMENT in
        dev)
            log_info "启动开发环境"
            ;;
        prod)
            log_info "启动生产环境"
            ;;
        all)
            log_info "启动所有环境"
            ;;
        stop)
            stop_services
            exit 0
            ;;
        status)
            show_status
            exit 0
            ;;
        help|--help|-h)
            show_help
            exit 0
            ;;
        *)
            log_error "无效的环境参数: $ENVIRONMENT"
            show_help
            exit 1
            ;;
    esac
    
    # 执行部署
    check_dependencies
    setup_environment
    install_dependencies
    
    case $ENVIRONMENT in
        dev)
            start_dev
            ;;
        prod)
            start_prod
            ;;
        all)
            start_dev
            sleep 5
            start_prod
            ;;
    esac
    
    echo ""
    log_success "部署完成! 🎉"
    echo ""
    echo "=== 服务地址 ==="
    if [ "$ENVIRONMENT" = "dev" ] || [ "$ENVIRONMENT" = "all" ]; then
        echo "开发环境:"
        echo "  前端: http://localhost:3000"
        echo "  后端: http://localhost:3001"
    fi
    if [ "$ENVIRONMENT" = "prod" ] || [ "$ENVIRONMENT" = "all" ]; then
        echo "生产环境:"
        echo "  前端: http://localhost:8001"
        echo "  后端: http://localhost:8080"
        echo "  API文档: http://localhost:8080/api"
    fi
    echo ""
    echo "=== 常用命令 ==="
    echo "查看状态: ./quick-deploy.sh status"
    echo "停止服务: ./quick-deploy.sh stop"
    echo "重新部署: ./quick-deploy.sh $ENVIRONMENT"
    echo ""
}

# 捕获 Ctrl+C
trap 'echo -e "\n${YELLOW}收到中断信号，停止服务...${NC}"; stop_services; exit 0' INT

# 执行主函数
main "$@"
