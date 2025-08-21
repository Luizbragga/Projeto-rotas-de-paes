Padaria Frontend

Este é o frontend do sistema de entregas recorrentes para padarias. Ele foi desenvolvido em React (Vite) e consome a API REST do backend para exibir e gerenciar rotas, entregas, pagamentos e estatísticas de forma prática e organizada.

Repositório do Backend

O repositório do backend deste sistema está disponível em:
👉 Padaria Backend

Tecnologias utilizadas

React (Vite)

React Router DOM (rotas)

Axios (requisições HTTP)

TailwindCSS (estilização)

Context API (autenticação e estado global)

ESLint + Prettier (padrões e qualidade de código)

O que este frontend faz

Realiza login de usuários (admin, gerente e entregador) com JWT

Controla acesso às páginas de acordo com a role do usuário

Exibe painel administrativo com estatísticas e relatórios

Exibe painel do gerente com gestão de entregas, pagamentos e inadimplência

Exibe painel do entregador com rota no mapa, entregas do dia, botão de concluir entrega, registrar pagamentos e relatar problemas

Consome a API REST do backend em tempo real

Estrutura pronta para dashboards e relatórios visuais

Autenticação e segurança

O frontend utiliza o token JWT fornecido pelo backend para autenticar o usuário.
O token é armazenado em localStorage e enviado automaticamente no header Authorization em todas as requisições.

Exemplo de header:

Authorization: Bearer <seu_token>

Comunicação com o backend

O frontend consome os seguintes endpoints principais do backend:

Método	Rota	Descrição
POST	/login	Login de usuário e geração de token JWT
GET	/entregas/hoje	Lista de entregas do dia
PUT	/entregas/:id/concluir	Marcar entrega como concluída
POST	/entregas/:id/pagamento	Registrar pagamento de uma entrega
PUT	/entregas/:id/problema	Relatar problema em uma entrega
GET	/analitico/inadimplentes	Listar clientes inadimplentes

(Demais rotas estão disponíveis no backend.)
