#!/bin/bash
set -e

# ---------------------------
# Sweety Load Balancer Deployment
# ---------------------------

PROJECT_NAME="sweety-loadbalancer"
COMPOSE_FILE="docker-compose.yml"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
echo_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
echo_error() { echo -e "${RED}[ERROR]${NC} $1"; }
echo_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
echo_success() { echo -e "${CYAN}[SUCCESS]${NC} $1"; }

# Print banner
cat << "EOF"
   ____                     _         _     ____  
  / ___|_      _____  ___| |_ _   _| |   | __ ) 
  \___ \ \ /\ / / _ \/ _ \ __| | | | |   |  _ \ 
   ___) \ V  V /  __/  __/ |_| |_| | |___| |_) |
  |____/ \_/\_/ \___|\___|\__|\__, |_____|____/ 
                              |___/             
  Load Balancer Deployment Script
EOF
echo ""

# Check if running as root or with docker permissions
if [ "$EUID" -ne 0 ] && ! groups | grep -q docker; then
    echo_error "Please run as root or add user to docker group"
    exit 1
fi

# Check if docker and docker-compose are installed
if ! command -v docker &> /dev/null; then
    echo_error "Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo_error "Docker Compose is not installed"
    exit 1
fi

# Set docker-compose command (v1 or v2)
if command -v docker-compose &> /dev/null; then
    DC_CMD="docker-compose"
else
    DC_CMD="docker compose"
fi

echo_info "Using Docker Compose command: $DC_CMD"

# Check if required files exist
if [ ! -f "$COMPOSE_FILE" ]; then
    echo_error "docker-compose.yml not found in current directory"
    exit 1
fi

if [ ! -f "nginx.conf" ]; then
    echo_error "nginx.conf not found in current directory"
    exit 1
fi

# Create required directories
echo_step "1. Creating required directories..."
mkdir -p ssl html logs
echo_info "Directories created: ssl/, html/, logs/"

# Create a simple index.html for testing
if [ ! -f "html/index.html" ]; then
    cat > html/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html>
<head>
    <title>Sweety Load Balancer</title>
    <style>
        body { font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .container { background: rgba(255,255,255,0.1); padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
        h1 { font-size: 48px; margin: 0; }
        .status { background: rgba(0,255,0,0.2); padding: 10px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🍬 Sweety Load Balancer</h1>
        <div class="status">✓ Load Balancer Active</div>
        <p>Traffic is being distributed across multiple backends</p>
        <p><a href="/health" style="color: white;">Health Check</a> | <a href="/lb-status" style="color: white;">LB Status</a></p>
    </div>
</body>
</html>
HTMLEOF
    echo_info "Created default html/index.html"
fi

# Stop any existing containers
echo_step "2. Stopping existing containers (if any)..."
$DC_CMD -p $PROJECT_NAME down 2>/dev/null || true

# Build and start services
echo_step "3. Building and starting services..."
$DC_CMD -p $PROJECT_NAME up -d --build

# Wait for services to be healthy
echo_step "4. Waiting for services to be healthy..."
echo_info "This may take up to 60 seconds..."

MAX_WAIT=60
ELAPSED=0
ALL_HEALTHY=false

while [ $ELAPSED -lt $MAX_WAIT ]; do
    sleep 5
    ELAPSED=$((ELAPSED + 5))
    
    # Check health status of all services
    UNHEALTHY=$($DC_CMD -p $PROJECT_NAME ps --format json 2>/dev/null | grep -c '"Health":"starting"' || echo "0")
    
    if [ "$UNHEALTHY" = "0" ]; then
        ALL_HEALTHY=true
        break
    fi
    
    echo_info "Waiting for services to be healthy... (${ELAPSED}s/${MAX_WAIT}s)"
done

# Display service status
echo_step "5. Service Status:"
$DC_CMD -p $PROJECT_NAME ps

echo ""
echo_step "6. Checking upstream health..."

# Test each backend
BACKENDS=("sweety-app:80" "sweety-apache:80" "sweety-tomcat:8080" "sweety-wildfly:8080")
for backend in "${BACKENDS[@]}"; do
    container_name=$(echo $backend | cut -d: -f1)
    if docker exec $container_name sh -c "command -v wget" &>/dev/null; then
        if docker exec $container_name wget -q -O- http://localhost:$(echo $backend | cut -d: -f2) &>/dev/null; then
            echo_success "✓ $container_name is healthy"
        else
            echo_warn "⚠ $container_name may not be responding"
        fi
    else
        echo_info "→ $container_name (health check via compose)"
    fi
done

echo ""
echo_step "7. Testing Load Balancer..."

# Get the server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

# Test health endpoint
if docker exec sweety-loadbalancer wget -q -O- http://localhost/health &>/dev/null; then
    echo_success "✓ Load balancer health check passed"
else
    echo_error "✗ Load balancer health check failed"
fi

# Test load balancing
echo_info "Testing load balancing (5 requests)..."
for i in {1..5}; do
    docker exec sweety-loadbalancer wget -q -O- http://localhost/ 2>/dev/null | head -n 1 || echo "Request $i sent"
done

echo ""
echo "=========================================="
echo_success "Deployment Complete!"
echo "=========================================="
echo ""
echo "Load Balancer Endpoints:"
echo "  → HTTP:        http://${SERVER_IP}/"
echo "  → Health:      http://${SERVER_IP}/health"
echo "  → LB Status:   http://${SERVER_IP}/lb-status"
echo "  → Admin:       http://${SERVER_IP}:8080/"
echo "  → App Traffic: http://${SERVER_IP}/app/"
echo ""
echo "Backend Services:"
echo "  → Nginx:   sweety-app (port 80)"
echo "  → Apache:  sweety-apache (port 80)"
echo "  → Tomcat:  sweety-tomcat (port 8080)"
echo "  → WildFly: sweety-wildfly (port 8080)"
echo ""
echo "Useful Commands:"
echo "  View logs:     $DC_CMD -p $PROJECT_NAME logs -f sweety-loadbalancer"
echo "  View all logs: $DC_CMD -p $PROJECT_NAME logs -f"
echo "  Restart:       $DC_CMD -p $PROJECT_NAME restart"
echo "  Stop:          $DC_CMD -p $PROJECT_NAME down"
echo "  Status:        $DC_CMD -p $PROJECT_NAME ps"
echo ""
echo "Test Load Balancing:"
echo "  curl http://${SERVER_IP}/"
echo "  curl http://${SERVER_IP}/health"
echo "  curl http://${SERVER_IP}/app/"
echo ""
echo_warn "Monitor upstream status with:"
echo "  watch -n 2 '$DC_CMD -p $PROJECT_NAME ps'"
echo ""

# Optional: Show live logs
read -p "Show live logs? [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo_info "Showing live logs (Ctrl+C to exit)..."
    $DC_CMD -p $PROJECT_NAME logs -f
fi
