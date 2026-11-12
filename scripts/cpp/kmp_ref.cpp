// KMP 参考：读入主串 t 与模式串 p，输出 pi 表与所有出现位置
#include <bits/stdc++.h>
using namespace std;

vector<int> buildPi(const string& p) {
    int m = (int)p.size();
    vector<int> pi(m, 0);
    for (int i = 1; i < m; i++) {
        int j = pi[i - 1];
        while (j > 0 && p[i] != p[j]) j = pi[j - 1];
        if (p[i] == p[j]) j++;
        pi[i] = j;
    }
    return pi;
}

vector<int> kmpSearch(const string& t, const string& p) {
    vector<int> res;
    int n = (int)t.size(), m = (int)p.size();
    if (m == 0) return res;
    vector<int> pi = buildPi(p);
    for (int i = 0, j = 0; i < n; ) {
        if (j > 0 && t[i] != p[j]) j = pi[j - 1];
        else if (t[i] == p[j]) { i++; j++; }
        else i++;
        if (j == m) { res.push_back(i - m); j = pi[j - 1]; }
    }
    return res;
}

int main() {
    string t, p;
    cin >> t >> p;
    if (p.empty()) { cout << "0\n0\n"; return 0; }
    vector<int> pi = buildPi(p);
    for (int i = 0; i < (int)pi.size(); i++) cout << pi[i] << " \n"[i + 1 == (int)pi.size()];
    vector<int> occ = kmpSearch(t, p);
    cout << occ.size() << "\n";
    for (int i = 0; i < (int)occ.size(); i++) cout << occ[i] << " \n"[i + 1 == (int)occ.size()];
    return 0;
}
