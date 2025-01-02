const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const db = new sqlite3.Database(path.join(__dirname, 'estoque.db')); // Corrigido aqui

// Configurar o body-parser para lidar com dados JSON e urlencoded
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar o motor de templates EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Defina a pasta 'views' como o diretório de visualizações

// Servir arquivos estáticos (CSS, JS, imagens)
app.use(express.static(path.join(__dirname, 'public')));

// Rota para a página inicial (exibe os agendamentos)
app.get('/', (req, res) => {
    db.all(`
        SELECT a.id, a.empresa, a.dataHora, a.tecnico, a.tipoServico, p.produto AS nome_produto, 
               p.local AS local_produto, a.observacoes, ap.quantidade 
        FROM agendamentos a
        LEFT JOIN agendamentos_produtos ap ON a.id = ap.id_agendamento
        LEFT JOIN produtos p ON ap.id_produto = p.id`, [], (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send('Erro ao buscar agendamentos');
        } else {
            // Renderiza o arquivo index.ejs e passa os dados para a view
            res.render('index', { agendamentos: rows });
        }
    });
});

app.post('/agendamentos', (req, res) => {
    const { empresa, dataHora, tecnico, tipoServico, pecas, observacoes } = req.body;

    // Verifica se já existe um agendamento com a mesma empresa, dataHora, e técnico
    const queryVerificacao = `
        SELECT * FROM agendamentos
        WHERE empresa = ? AND dataHora = ? AND tecnico = ?`;
    
    db.get(queryVerificacao, [empresa, dataHora, tecnico], (err, row) => {
        if (err) {
            return res.status(500).send('Erro ao verificar agendamento');
        }

        if (row) {
            // Se encontrar um agendamento com as mesmas informações
            return res.status(400).send('Já existe um agendamento com esses dados.');
        }

        // Insira o agendamento na tabela de agendamentos
        const queryAgendamento = `
            INSERT INTO agendamentos (empresa, dataHora, tecnico, tipoServico, observacoes)
            VALUES (?, ?, ?, ?, ?)`;

        db.run(queryAgendamento, [empresa, dataHora, tecnico, tipoServico, observacoes], function(err) {
            if (err) {
                return res.status(500).send('Erro ao criar agendamento');
            }

            const agendamentoId = this.lastID; // Pega o ID do agendamento inserido

            // Agora insira as peças associadas ao agendamento (caso haja)
            const queryAgendamentoProduto = `
                INSERT INTO agendamentos_produtos (id_agendamento, id_produto, quantidade)
                VALUES (?, ?, ?)`;

            if (Array.isArray(pecas) && pecas.length > 0) {
                pecas.forEach(peca => {
                    db.run(queryAgendamentoProduto, [agendamentoId, peca.id_produto, peca.quantidade], (err) => {
                        if (err) {
                            return res.status(500).send('Erro ao associar produto ao agendamento');
                        }
                    });
                });
            }

            res.status(200).send('Agendamento criado com sucesso');
        });
    });
});


// Rota para editar um agendamento existente
app.put('/agendamentos/:id', (req, res) => {
    const { id } = req.params;
    const { empresa, dataHora, tecnico, tipoServico, pecas, observacoes } = req.body;

    // Atualiza o agendamento na tabela agendamentos
    db.run('UPDATE agendamentos SET empresa = ?, dataHora = ?, tecnico = ?, tipoServico = ?, observacoes = ? WHERE id = ?', 
        [empresa, dataHora, tecnico, tipoServico, observacoes, id], 
        function(err) {
            if (err) {
                console.error(err);
                res.status(500).send('Erro ao editar agendamento');
            } else {
                // Primeiro, exclui os produtos antigos para o agendamento
                db.run('DELETE FROM agendamentos_produtos WHERE id_agendamento = ?', [id], (err) => {
                    if (err) {
                        return res.status(500).send('Erro ao remover produtos antigos');
                    }

                    // Agora insere os novos produtos
                    const queryAgendamentoProduto = `
                        INSERT INTO agendamentos_produtos (id_agendamento, id_produto, quantidade)
                        VALUES (?, ?, ?)`;

                    if (Array.isArray(pecas) && pecas.length > 0) {
                        pecas.forEach(peca => {
                            db.run(queryAgendamentoProduto, [id, peca.id_produto, peca.quantidade], (err) => {
                                if (err) {
                                    return res.status(500).send('Erro ao associar novo produto ao agendamento');
                                }
                            });
                        });
                    }

                    res.send('Agendamento atualizado com sucesso');
                });
            }
        });
});
// Rota para obter os detalhes de um agendamento
app.get('/agendamentos/:id', (req, res) => {
    const { id } = req.params;
    
    db.get(`
        SELECT a.id, a.empresa, a.dataHora, a.tecnico, a.tipoServico, a.observacoes, 
               p.produto AS nome_produto, ap.quantidade 
        FROM agendamentos a
        LEFT JOIN agendamentos_produtos ap ON a.id = ap.id_agendamento
        LEFT JOIN produtos p ON ap.id_produto = p.id
        WHERE a.id = ?`, [id], (err, row) => {
        if (err) {
            console.error(err);
            res.status(500).send('Erro ao buscar agendamento');
        } else {
            // Retorna os dados do agendamento em formato JSON para o frontend
            res.json(row);
        }
    });
});
app.delete('/agendamentos/:id', (req, res) => {
    const { id } = req.params;

    // Primeiro, exclua os produtos associados ao agendamento
    db.run('DELETE FROM agendamentos_produtos WHERE id_agendamento = ?', [id], (err) => {
        if (err) {
            return res.status(500).send('Erro ao excluir produtos associados');
        }

        // Agora, exclua o agendamento
        db.run('DELETE FROM agendamentos WHERE id = ?', [id], (err) => {
            if (err) {
                return res.status(500).send('Erro ao excluir agendamento');
            }

            res.send('Agendamento excluído com sucesso');
        });
    });
});



// Iniciar o servidor
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
