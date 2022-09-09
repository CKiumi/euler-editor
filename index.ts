/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { loadFont } from "euler-tex/src/lib";
import "./src/engine/pyodide";
import EulerEditor from "./src/note";
loadFont();

const main = document.getElementById("main");
[1].forEach(() => {
  main!.innerHTML += `
  <euler-editor id="t"></euler-editor>
  `;
});
const eulerNote = document.getElementById("t") as EulerEditor;

eulerNote.addEventListener("mount", () => {
  const intro = String.raw`
\section{Introduction}
The rest of this paper is organized as follows. In Section \ref{sec:2}, we define $n$-state QWs with $n-2$ self-loops, which is an extension of three-state QWs on the integer lattice. Then, we give the transfer matrix in a general way and construct methods for the eigenvalue problem.
Theorem \ref{Theorem Ker} is the main theorem, which gives a necessary and sufficient condition for the eigenvalue problem.  Section \ref{sec:3} focuses on the concrete calculation of eigenvalues on one-defect and two-phase three-state QWs with generalized Grover coin matrices. We also show some figures indicating eigenvalues of the time evolution operators and their corresponding probability distributions in this section.`;
  const sec2 = String.raw`\section{Definitions and Method}
\label{sec:2}
\subsection{Multi-state quantum walks on the integer lattice}
Firstly, we introduce $n$-state QWs with $n-2$ self-loops on the integer lattice $\mathbb{Z}$.
Let $\mathcal{H}$ be a Hilbert space defined by
\begin{equation}
      \mathcal{H}=\ell^2(\mathbb{Z} ; \mathbb{C}^n) =
      \left\{
      \Psi : \mathbb{Z} \to \mathbb{C}^n\ \middle\vert\ \sum_{x\in\mathbb{Z}}\|\Psi(x)\|_{\mathbb{C}^n}^2 < \infty
      \right\},
      \label{eq:0}
\end{equation}
      where $n \geq 3$ and $\mathbb{C}$ denotes the set of complex numbers. We write $n$-state quantum state $\Psi:\mathbb{Z}\rightarrow \mathbb{C}^n$ as below:
      \[
      \Psi (x)=\left[\begin{matrix}
      \Psi _{1} (x)\\
      \Psi _{2} (x)\\
      \vdots \\
      \Psi _{n} (x)
      \end{matrix}\right].
      \]
      Let $\{C_x\}_{x\in\mathbb{Z}}$ be a sequence of $n\times n$ unitary matrices, which is written as below:
      \[
      C_{x} =e^{i\Delta _{x}}\left[\begin{matrix}
      a_{x}^{( 1,1)} & a_{x}^{( 1,2)} & \dotsc  & a_{x}^{( 1,n)}\\
      a_{x}^{( 2,1)} & a_{x}^{( 2,2)} & \dotsc  & a_{x}^{( 2,n)}\\
      \vdots  & \vdots  & \ddots  & \vdots \\
      a_{x}^{( n,1)} & a_{x}^{( n,2)} & \dotsc  & a_{x}^{( n,n)}
      \end{matrix}\right].\]
       where $\Delta_x \in [0,2\pi),\  a^{(j,k)}_x\in\mathbb{C},(1\leq j, k\leq n)$ and $|a^{(k,k)}_x|\neq 1 \ (2\leq k\leq n-1)$. Here we define $C_x$ with additional phases $\Delta_x$ for the simplification of the discussion in Subsection \ref{subsec:transfer}.
      Then the coin operator $C$ on $\mathcal{H}$ is given as 
      \[(C\Psi)=C_x\Psi(x).\]
      The shift operator $S$ is also an operator on $\mathcal{H}$, which shifts $\Psi_1(x)$ and $\Psi_n(x)$ to $\Psi_1(x-1)$ and $\Psi_n(x+1)$, respectively and does not move $\Psi_k(x)$ for $2\leq k \leq n-1$.

\[
(S\Psi )(x)=\left[\begin{array}
\Psi _{1} (x+1)\\
\Psi _{2} (x)\\
\vdots \\
\Psi _{k} (x)\\
\vdots \\
\Psi _{n-1} (x)\\
\Psi _{n} (x-1)
\end{array}\right] ,\qquad 2\leq k\leq n-1.\ \]
Then the time evolution operator is given as  
\[
U=SC.
\]
We treat the model whose coin matrices satisfy
\[
C_x =
\begin{cases}
C_\infty ,\quad & x\in [ x_{+} ,\infty ),
\\
C_{-\infty} ,\quad & x\in ( -\infty ,x_{-}].
\end{cases}
\]
where $x_+>0,\ x_-<0$. For initial state $\Psi_0\in\mathcal{H}\ (\|\Psi_0\|_{\mathcal{H}}^2=1)$, the finding probability of a walker in position $x$ at time $t\in\mathbb{Z}_{\geq 0}$ is defined by 
\[\mu_t^{(\Psi_0)}(x)=\|(U^t\Psi_0)(x)\|_{\mathbb{C}^n}^2,\] 
where $\mathbb{Z}_{\geq 0}$ is the set of non-negative integers. We say that the QW exhibits localization if there exists a position $x_0\in\mathbb{Z}$ and an initial state $\Psi_0\in\mathcal{H}$ satisfying $\limsup_{t\to\infty}\mu^{(\Psi_0)}_t(x_0)>0$. It is known that the QW exhibits localization if and only if there exists an eigenvalue of $U$ \cite{Segawa2016-qu}, that is, there exists $\lambda\in[0, 2\pi)$ and $\Psi\in\mathcal{H}\setminus\{\mathbf{0}\}$  such that
      \begin{align*}
	U\Psi=e^{i\lambda}\Psi.
	\end{align*}
Let $\sigma_p(U)$ denotes the set of eigenvalues of $U$, henceforward.

\subsection{Eigenvalue problem and transfer matrix}
\label{subsec:transfer}
The method to solve the eigenvalue problem of space-inhomogeneous two-state QWs with the transfer matrix was introduced in \cite{Kiumi2021-yg,Kiumi2021-dp}. This subsection shows that the transfer matrix method can also be applied to $n$-state QWs with $n-2$ self-loops. Firstly, $U\Psi =e^{i\lambda }\Psi$ is equivalent that $\Psi\in\mathcal{H}$ satisfies followings for all $x\in\mathbb{Z}$:
\[
      e^{i( \lambda -\Delta _{x})} \Psi _{1} (x-1)=\sum _{i=1}^{n} a_{x}^{( 1,i)} \Psi _{i} (x),\quad
      e^{i( \lambda -\Delta _{x})} \Psi _{n} (x+1)=\sum _{i=1}^{n} a_{x}^{( n,i)} \Psi _{i} (x),
      \]
      and for $2\leq k\leq n-1$
      \[
      e^{i( \lambda -\Delta _{x})} \Psi _{k} (x)=\sum _{i=1}^{n} a_{x}^{( k,i)} \Psi _{i} (x)\Longleftrightarrow \Psi _{k} (x)=\frac{\sum _{i=1,i\neq k}^{n} a_{x}^{( k,i)} \Psi _{i} (x)}{e^{i( \lambda -\Delta _{x})} -a_{x}^{( k,k)}}.
      \]
      where $\Longleftrightarrow$ denotes \`\`if and only if''. By repetition of substitutions, we can eliminate $\Psi_k(x)\ (2\leq k\leq n-1)$ from this system of equations, and this can be converted to the following equivalent system of equations:
      \begin{align}
      \label{eq1}
       & e^{i( \lambda -\Delta _{x})} \Psi _{1} (x-1)=A_{x}( \lambda ) \Psi _{1} (x)+B_{x}( \lambda ) \Psi _{n} (x),\\
       \label{eq2}
       & e^{i( \lambda -\Delta _{x})} \Psi _{n} (x+1)=C_{x}( \lambda ) \Psi _{1} (x)+D_{x}( \lambda ) \Psi _{n} (x),\\
       \label{eq3}
       & \Psi _{k} (x)=E_{k,x}( \lambda ) \Psi _{1} (x)+F_{k,x}( \lambda ) \Psi _{n} (x),
      \end{align}
      where $A_x(\lambda),B_x(\lambda),C_x(\lambda),D_x(\lambda),E_{k,x}(\lambda),F_{k,x}(\lambda)$ are $\mathbb{C}$-valued function and their absolute values are finite real numbers. When $\displaystyle n=3,$ these values become
      \begin{align*}
       & A_{x}( \lambda ) =a_{x}^{( 1,1)} +\frac{a_{x}^{( 1,2)} a_{x}^{( 2,1)}}{e^{i( \lambda -\Delta _{x})} -a_{x}^{( 2,2)}} ,\ B_{x}( \lambda ) =a_{x}^{( 1,3)} +\frac{a_{x}^{( 1,2)} a_{x}^{( 2,3)}}{e^{i( \lambda -\Delta _{x})} -a_{x}^{( 2,2)}} ,\\
       & C_{x}( \lambda ) =a_{x}^{( 3,1)} +\frac{a_{x}^{( 3,2)} a_{x}^{( 2,1)}}{e^{i( \lambda -\Delta _{x})} -a_{x}^{( 2,2)}} ,\ D_{x}( \lambda ) =a_{x}^{( 3,3)} +\frac{a_{x}^{( 3,2)} a_{x}^{( 2,3)}}{e^{i( \lambda -\Delta _{x})} -a_{x}^{( 2,2)}} ,\\
       & E_{2,x}( \lambda ) =\frac{a_{x}^{( 2,1)}}{e^{i( \lambda -\Delta _{x})} -a_{x}^{( 2,2)}} ,\ F_{2,x}( \lambda ) =\frac{a_{x}^{( 2,3)}}{e^{i( \lambda -\Delta _{x})} -a_{x}^{( 2,2)}} .
      \end{align*}
       Note that $\Psi:\mathbb{Z}\rightarrow\mathbb{C}^n$, where $\Psi$ does not necessarily satisfy $\|\sum_{x\in\mathbb{Z}}\Psi(x)\|_{\mathbb{C}^n}^2<\infty$ but satisfies (\ref{eq1}), (\ref{eq2}), (\ref{eq3}) is a generalized eigenvector of $U$, which is the stationary measure of QWs studied in \cite{Wang2015-oy,Kawai2017-fn,Kawai2018-ry,Endo2019-ie}. Here, we define transfer matrices $T_x(\lambda)$ by
      \[
      T_x(\lambda)=\frac{1}{A_{x}( \lambda )}\begin{bmatrix}
      e^{i( \lambda -\Delta _{x})} & -B_{x}( \lambda )\\
      C_{x}( \lambda ) & -e^{-i( \lambda -\Delta _{x})}( B_{x}( \lambda ) C_{x}( \lambda ) -A_{x}( \lambda ) D_{x}( \lambda ))
      \end{bmatrix},
      \]
      then equations (\ref{eq1}), (\ref{eq2}) can be written as 
      \[
      \begin{bmatrix}
      \Psi _{1} (x)\\
      \Psi _{n} (x+1)
      \end{bmatrix} =T_x(\lambda)\begin{bmatrix}
      \Psi _{1} (x-1)\\
      \Psi _{n} (x)
      \end{bmatrix}.
      \]
      Note that, when $A_x(\lambda)=0$, we cannot construct a transfer matrix. Therefore, we have to treat the case $A_x(\lambda)=0$ separately. For simplification, we write $T_x(\lambda)$ as $T_x$ henceforward. Let $\lambda\in[0,2\pi)$ satisfying $A_x(\lambda)\neq0$ for all $x\in\mathbb{Z}$ and $\varphi \in\mathbb{C}^2$, we define $\tilde{\Psi}:\mathbb{Z}\rightarrow\mathbb{C}^2$ as follows: 
            \begin{align}
            \label{cor:tilde_psi}
      \tilde{\Psi } (x) & =\begin{cases}
      T_{x-1} T_{x-2} \cdots T_{1} T_{0} \varphi , & x >0,\\
      \varphi , & x=0,\\
      T^{-1}_{x} T^{-1}_{x+1} \cdots T^{-1}_{-2} T^{-1}_{-1} \varphi , & x< 0.
      \end{cases} \\
       & =\begin{cases}
      T_{\infty}^{x-x_{+}} T_{+} \varphi,  & x_{+} \leq x,\\
      T_{x-1} \cdots T_{0} \varphi,  & 0< x< x_{+},\\
      \varphi,  & x=0,\\
      T^{-1}_{x} \cdots T^{-1}_{-1} \varphi,  & x_{-} < x< 0,\\
      T^{x-x_{-}}_{-\infty } T_{-} \varphi,  & x \leq x_{-}.
      \end{cases}
      \end{align}
      where $T_{+}=T_{x_{+} -1} \cdots T_{0},\  T_{-} = T^{-1}_{x_{-}} \cdots T^{-1}_{-1}$ and $T_{\pm \infty} = T_{x_\pm}$. 
      Let $V_{\lambda}$ be a set of generalized eigenvectors and $W_{\lambda}$ be a set of reduced vectors $\tilde\Psi$ defined by (\ref{cor:tilde_psi}):
      \begin{align*}
      V_{\lambda}&=\left\{\Psi:\mathbb{Z}\rightarrow\mathbb{C}^n\ \middle|\  \Psi \text{ satisfies } (\ref{eq1}),(\ref{eq2}), (\ref{eq3})\right\},
      \\
      W_{\lambda}&=\left\{\tilde\Psi:\mathbb{Z}\rightarrow\mathbb{C}^2\ \middle|\  \tilde\Psi(x)\text{ is given by }  (\ref{cor:tilde_psi}),\  \varphi\in\mathbb{C}^2\right\},
      \end{align*}
       for $\lambda\in[0,2\pi)$ satisfying $A_x(\lambda)\neq0$ for all $x\in\mathbb{Z}$. We define bijective map $\iota:V_{\lambda}\rightarrow W_{\lambda}$ by
      \[
      (\iota \Psi)(x)=\left[\begin{array}
      \Psi_{1}(x-1) \\
      \Psi_{n}(x)
      \end{array}\right].
      \]
      \begin{corollary}\label{cor:ell2}
      Let $\lambda\in [0,2\pi)$ satisfying $A_x(\lambda)\neq0$ for all $x$, $e^{i\lambda}\in\sigma_p(U)$ if and only if there exists $\tilde\Psi\in W_{\lambda} \setminus\{\mathbf{0}\}$ such that $\tilde\Psi\in\ell^2(\mathbb{Z};\mathbb{C}^2)$, and associated eigenvector of $e^{i\lambda}$ becomes $\iota^{-1}\tilde\Psi$.
      \end{corollary}s
      `;
  const article = String.raw`${intro}${sec2}`;
  eulerNote.set(article);
});
