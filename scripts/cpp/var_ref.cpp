// int 溢出模拟参考：a b → 按 32 位回绕的结果（与页面演示同一模拟方式）
#include <bits/stdc++.h>
using namespace std;
int main() {
    long long a, b;
    cin >> a >> b;
    long long sum = a + b;
    unsigned int u = (unsigned int)((unsigned long long)sum & 0xFFFFFFFFULL);
    int wrapped;
    if (u >= 2147483648u) wrapped = (int)(u - 4294967296ULL);
    else wrapped = (int)u;
    cout << wrapped << "\n";
    return 0;
}
