#!/bin/bash

# ---------------------------
# Load Balancer Testing & Monitoring Script
# ---------------------------

PROJECT_NAME="sweety-loadbalancer"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
echo_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
echo_error() { echo -e "${RED}[ERROR]${NC} $1"; }
echo_test() { echo -e "${CYAN}[TEST]${NC} $1"; }
echo_result() { echo -e "${MAGENTA}[RESULT]${NC} $1"; }

SERVER_IP=$(hostname -I | awk '{print $1}')
LB_URL="http://${app-server}"

cat << "EOF"
   _____            _         _     ____  
  |_   _|__  ___ | |_      | |   | __ ) 
    | |/ _ \/ __|| __|     | |   |  _ \ 
    | |  __/\__ \| |_      | |___| |_) |
    |_|\___||___/ \__|     |_____|____/ 
  Load Balancer Testing Tool
EOF
echo ""

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local expected=$2
    
    echo_test "Testing: $endpoint"
    response=$(curl -s -w "\n%{http_code}" "$endpoint" 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "$expected" ]; then
        echo_result "✓ Status: $http_code (Expected: $expected)"
        return 0
    else
        echo_error "✗ Status: $http_code (Expected: $expected)"
        return 1
    fi
}

# Function to check service health
check_service_health() {
    local service=$1
    
    if docker ps --format '{{.Names}}' | grep -q "^${service}$"; then
        health=$(docker inspect --format='{{.State.Health.Status}}' "$service" 2>/dev/null || echo "no-healthcheck")
        status=$(docker inspect --format='{{.State.Status}}' "$service")
        
        if [ "$health" = "healthy" ] || [ "$status" = "running" ]; then
            echo_result "  ✓ $service: ${status} ${health}"
            return 0
        else
            echo_warn "  ⚠ $service: ${status} ${health}"
            return 1
        fi
    else
        echo_error "  ✗ $service: not found"
        return 1
    fi
}

# Function to test load distribution
test_load_distribution() {
    local num_requests=$1
    echo_test "Testing load distribution with $num_requests requests..."
    
    declare -A backend_hits
    
    for i in $(seq 1 $num_requests); do
        # Make request and capture which backend responded
        response=$(curl -s "$LB_URL/" 2>/dev/null)
        
        # Simple counter (in real scenario, backends would identify themselves)
        backend_hits["backend_$((i % 4))"]=$((${backend_hits["backend_$((i % 4))"]} + 1))
        
        echo -n "."
    done
    
    echo ""
    echo_result "Requests completed: $num_requests"
    echo_info "Distribution simulation completed"
}

# Function to simulate backend failure
simulate_failure() {
    local service=$1
    echo_warn "Simulating failure of $service..."
    docker stop "$service"
    sleep 2
    echo_test "Testing if load balancer handles failure..."
    
    for i in {1..5}; do
        if curl -s -o /dev/null -w "%{http_code}" "$LB_URL/" 2>/dev/null | grep -q "200"; then
            echo_result "  ✓ Request $i: Load balancer still serving traffic"
        else
            echo_error "  ✗ Request $i: Failed"
        fi
    done
    
    echo_info "Restarting $service..."
    docker start "$service"
    sleep 5
    echo_result "Service $service restarted"
}

# Main menu
show_menu() {
    echo ""
    echo "╔════════════════════════════════════════╗"
    echo "║  Load Balancer Testing Menu           ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    echo "1) Quick Health Check"
    echo "2) Detailed Service Status"
    echo "3) Test All Endpoints"
    echo "4) Load Distribution Test"
    echo "5) Upstream Health Check"
    echo "6) Simulate Backend Failure"
    echo "7) Continuous Monitoring"
    echo "8) View Logs"
    echo "9) Performance Test"
    echo "0) Exit"
    echo ""
}

# Quick health check
quick_health_check() {
    echo_test "=== Quick Health Check ==="
    test_endpoint "$LB_URL/health" "200"
    test_endpoint "$LB_URL/lb-status" "200"
    test_endpoint "$LB_URL/" "200"
    echo ""
}

# Detailed status
detailed_status() {
    echo_test "=== Detailed Service Status ==="
    
    services=("sweety-loadbalancer" "sweety-app" "sweety-apache" "sweety-tomcat" "sweety-wildfly")
    
    healthy_count=0
    total_count=${#services[@]}
    
    for service in "${services[@]}"; do
        if check_service_health "$service"; then
            ((healthy_count++))
        fi
    done
    
    echo ""
    echo_result "Healthy services: $healthy_count/$total_count"
    
    if [ $healthy_count -eq $total_count ]; then
        echo_result "✓ All services are healthy"
    else
        echo_warn "⚠ Some services are not healthy"
    fi
    echo ""
}

# Test all endpoints
test_all_endpoints() {
    echo_test "=== Testing All Endpoints ==="
    
    endpoints=(
        "$LB_URL/:200"
        "$LB_URL/health:200"
        "$LB_URL/lb-status:200"
        "$LB_URL:8080/:200"
        "$LB_URL/app/:200"
    )
    
    passed=0
    total=${#endpoints[@]}
    
    for endpoint_spec in "${endpoints[@]}"; do
        endpoint=$(echo "$endpoint_spec" | cut -d: -f1,2,3)
        expected=$(echo "$endpoint_spec" | cut -d: -f4)
        
        if test_endpoint "$endpoint" "$expected"; then
            ((passed++))
        fi
        echo ""
    done
    
    echo_result "Tests passed: $passed/$total"
    echo ""
}

# Upstream health
upstream_health() {
    echo_test "=== Upstream Backend Health ==="
    
    backends=("sweety-app" "sweety-apache" "sweety-tomcat" "sweety-wildfly")
    
    for backend in "${backends[@]}"; do
        check_service_health "$backend"
    done
    echo ""
}

# Continuous monitoring
continuous_monitoring() {
    echo_info "Starting continuous monitoring (Ctrl+C to stop)..."
    echo ""
    
    while true; do
        clear
        echo "╔════════════════════════════════════════╗"
        echo "║  Live Monitoring - $(date '+%H:%M:%S')        ║"
        echo "╚════════════════════════════════════════╝"
        echo ""
        
        detailed_status
        
        echo_test "Recent Requests:"
        for i in {1..3}; do
            status=$(curl -s -o /dev/null -w "%{http_code}" "$LB_URL/" 2>/dev/null)
            if [ "$status" = "200" ]; then
                echo_result "  ✓ Request $i: HTTP $status"
            else
                echo_error "  ✗ Request $i: HTTP $status"
            fi
        done
        
        echo ""
        echo_info "Refreshing in 5 seconds..."
        sleep 5
    done
}

# Performance test
performance_test() {
    echo_test "=== Performance Test ==="
    
    local num_requests=100
    local concurrent=10
    
    echo_info "Running $num_requests requests with $concurrent concurrent connections..."
    
    if command -v ab &> /dev/null; then
        ab -n $num_requests -c $concurrent "$LB_URL/" 2>/dev/null | grep -E "Requests per second|Time per request|Failed requests"
    else
        echo_warn "Apache Bench (ab) not installed. Using simple test..."
        
        start_time=$(date +%s)
        
        for i in $(seq 1 $num_requests); do
            curl -s -o /dev/null "$LB_URL/" &
            
            if [ $((i % concurrent)) -eq 0 ]; then
                wait
            fi
        done
        wait
        
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        rps=$((num_requests / duration))
        
        echo_result "Completed $num_requests requests in ${duration}s"
        echo_result "Approximate rate: ${rps} requests/second"
    fi
    echo ""
}

# Main loop
while true; do
    show_menu
    read -p "Select option: " choice
    
    case $choice in
        1) quick_health_check ;;
        2) detailed_status ;;
        3) test_all_endpoints ;;
        4) test_load_distribution 20 ;;
        5) upstream_health ;;
        6)
            echo ""
            read -p "Enter service name to simulate failure (e.g., sweety-app): " service
            simulate_failure "$service"
            ;;
        7) continuous_monitoring ;;
        8)
            read -p "Show logs for which service? (all/sweety-loadbalancer/etc): " service
            if [ "$service" = "all" ]; then
                docker-compose -p $PROJECT_NAME logs -f
            else
                docker logs -f "$service"
            fi
            ;;
        9) performance_test ;;
        0)
            echo_info "Exiting..."
            exit 0
            ;;
        *)
            echo_error "Invalid option"
            ;;
    esac
    
    if [ "$choice" != "7" ] && [ "$choice" != "8" ]; then
        read -p "Press Enter to continue..."
    fi
done
