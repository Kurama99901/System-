const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite')); // Usando database.sqlite

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
        SELECT a.id, a.clienteId, a.dataHora, a.tecnico, a.tipoServico, a.observacoes, a.frotaModelo, a.numeroChassi
        FROM Agendamentos a`, [], (err, rows) => {
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
    const { clienteId, dataHora, tecnico, tipoServico, observacoes, frotaModelo, numeroChassi } = req.body;

    // Verifica se já existe um agendamento com o mesmo cliente, dataHora, e técnico
    const queryVerificacao = `
        SELECT * FROM Agendamentos
        WHERE clienteId = ? AND dataHora = ? AND tecnico = ?`;
    
    db.get(queryVerificacao, [clienteId, dataHora, tecnico], (err, row) => {
        if (err) {
            return res.status(500).send('Erro ao verificar agendamento');
        }

        if (row) {
            // Se encontrar um agendamento com as mesmas informações
            return res.status(400).send('Já existe um agendamento com esses dados.');
        }

        // Insira o agendamento na tabela de agendamentos
        const queryAgendamento = `
            INSERT INTO Agendamentos (clienteId, dataHora, tecnico, tipoServico, observacoes, frotaModelo, numeroChassi)
            VALUES (?, ?, ?, ?, ?, ?, ?)`;

        db.run(queryAgendamento, [clienteId, dataHora, tecnico, tipoServico, observacoes, frotaModelo, numeroChassi], function(err) {
            if (err) {
                return res.status(500).send('Erro ao criar agendamento');
            }

            res.status(200).send('Agendamento criado com sucesso');
        });
    });
});

// Rota para editar um agendamento existente
app.put('/agendamentos/:id', (req, res) => {
    const { id } = req.params;
    const { clienteId, dataHora, tecnico, tipoServico, observacoes, frotaModelo, numeroChassi } = req.body;

    // Atualiza o agendamento na tabela agendamentos
    db.run('UPDATE Agendamentos SET clienteId = ?, dataHora = ?, tecnico = ?, tipoServico = ?, observacoes = ?, frotaModelo = ?, numeroChassi = ? WHERE id = ?', 
        [clienteId, dataHora, tecnico, tipoServico, observacoes, frotaModelo, numeroChassi, id], 
        function(err) {
            if (err) {
                console.error(err);
                res.status(500).send('Erro ao editar agendamento');
            } else {
                res.send('Agendamento atualizado com sucesso');
            }
        });
});

// Rota para obter os detalhes de um agendamento
app.get('/agendamentos/:id', (req, res) => {
    const { id } = req.params;
    
    db.get(`
        SELECT a.id, a.clienteId, a.dataHora, a.tecnico, a.tipoServico, a.observacoes, a.frotaModelo, a.numeroChassi
        FROM Agendamentos a
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

// Rota para excluir um agendamento
app.delete('/agendamentos/:id', (req, res) => {
    const { id } = req.params;

    // Exclua o agendamento
    db.run('DELETE FROM Agendamentos WHERE id = ?', [id], (err) => {
        if (err) {
            return res.status(500).send('Erro ao excluir agendamento');
        }

        res.send('Agendamento excluído com sucesso');
    });
});

// Rotas para obter dados de PosVendas e ClientesFRTs
app.get('/api/posvendas', (req, res) => {
    db.all('SELECT * FROM PosVendas', [], (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send('Erro ao buscar dados de Pós Vendas');
        } else {
            res.json(rows);
        }
    });
});

app.get('/api/clientesfrts', (req, res) => {
    db.all('SELECT * FROM ClientesFRTs', [], (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send('Erro ao buscar dados de Clientes FRTs');
        } else {
            res.json(rows);
        }
    });
});

// Iniciar o servidor na porta 3001
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});