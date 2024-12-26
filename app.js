const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const db = new sqlite3.Database(path.join(__dirname, 'public', 'estoque.db'));

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

// Rota para criar um novo agendamento
app.post('/agendamentos', (req, res) => {
    const { empresa, dataHora, tecnico, tipoServico, pecas, observacoes } = req.body;

    // Primeiro, insira o agendamento na tabela de agendamentos
    const queryAgendamento = `
        INSERT INTO agendamentos (empresa, dataHora, tecnico, tipoServico, observacoes)
        VALUES (?, ?, ?, ?, ?)`;
    
    db.run(queryAgendamento, [empresa, dataHora, tecnico, tipoServico, observacoes], function(err) {
        if (err) {
            return res.status(500).send('Erro ao criar agendamento');
        }

        const agendamentoId = this.lastID; // Pega o ID do agendamento inserido
        const queryAgendamentoProduto = `
            INSERT INTO agendamentos_produtos (id_agendamento, id_produto, quantidade)
            VALUES (?, ?, ?)`;

        // Verifica se "pecas" é um array de objetos e insere cada produto associado ao agendamento
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

// Iniciar o servidor
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
