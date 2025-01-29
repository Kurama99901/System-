// Função para abrir o modal de seleção de tipo de cliente
document.getElementById('agendamentoLink').addEventListener('click', function (e) {
    e.preventDefault();
    var tipoClienteModal = new bootstrap.Modal(document.getElementById('tipoClienteModal'));
    tipoClienteModal.show(); // Abre o modal de tipo de cliente
});

// Função para abrir o modal de agendamento com base na escolha do tipo de cliente
document.getElementById('posVendasBtn').addEventListener('click', function() {
    var tipoClienteModal = bootstrap.Modal.getInstance(document.getElementById('tipoClienteModal'));
    tipoClienteModal.hide();  // Fecha o modal de tipo de cliente

    // Atualiza o select de clientes para o tipo selecionado
    fetch('/api/posvendas')
        .then(response => response.json())
        .then(data => {
            const empresaSelect = document.getElementById('empresa');
            empresaSelect.innerHTML = '';
            data.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.id;
                option.text = cliente.nomeCliente;
                empresaSelect.appendChild(option);
            });
            document.getElementById('frotaContainer').style.display = 'none'; // Esconde o select de frotas
        });

    // Agora abre o modal de agendamento, após a escolha do tipo de cliente
    var agendamentoModal = new bootstrap.Modal(document.getElementById('agendamentoModal'));
    agendamentoModal.show();  // Exibe o modal de agendamento
});
document.getElementById('frotaPropriaBtn').addEventListener('click', function() {
    var tipoClienteModal = bootstrap.Modal.getInstance(document.getElementById('tipoClienteModal'));
    tipoClienteModal.hide();  // Fecha o modal de tipo de cliente

    // Atualiza o select de clientes para o tipo selecionado
    fetch('/api/clientesfrts')
        .then(response => response.json())
        .then(data => {
            const empresaSelect = document.getElementById('empresa');
            empresaSelect.innerHTML = '';
            data.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.id;
                option.text = cliente.nomeCliente;
                empresaSelect.appendChild(option);
            });
            document.getElementById('frotaContainer').style.display = 'block'; // Mostra o select de frotas

            // Atualiza o select de frotas com base na empresa selecionada
            empresaSelect.addEventListener('change', function() {
                const selectedCliente = data.find(cliente => cliente.id == this.value);
                const frotaSelect = document.getElementById('frota');
                frotaSelect.innerHTML = '';
                if (selectedCliente && selectedCliente.frotaModelo) {
                    const option = document.createElement('option');
                    option.value = selectedCliente.frotaModelo;
                    option.text = selectedCliente.frotaModelo;
                    frotaSelect.appendChild(option);
                }
            });
        });

    // Agora abre o modal de agendamento, após a escolha do tipo de cliente
    var agendamentoModal = new bootstrap.Modal(document.getElementById('agendamentoModal'));
    agendamentoModal.show();  // Exibe o modal de agendamento
});
// Função para atualizar o select de clientes com base na seleção do tipo de cliente
function atualizarSelectClientes(clientes) {
    const select = document.getElementById('empresa');
    select.innerHTML = ''; // Limpa as opções atuais do select

    clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.value;
        option.text = cliente.text;
        select.appendChild(option);
    });
}

// Submeter o formulário de agendamento via AJAX
$(document).ready(function() {
    $('#agendamentoForm').submit(function(e) {
        e.preventDefault(); // Previne o envio do formulário padrão

        var formData = $(this).serialize(); // Serializa os dados do formulário

        // Adicionando um indicador de carregamento para prevenir o envio múltiplo
        $('#agendamentoForm button[type="submit"]').prop('disabled', true); // Desabilita o botão de envio
        $('#agendamentoForm button[type="submit"]').text('Enviando...'); // Alterando o texto para indicar o envio

        $.ajax({
            type: 'POST',
            url: '/agendamentos', // Certifique-se de que a rota no servidor está correta
            data: formData,
            success: function(response) {
                alert('Agendamento criado com sucesso');
                $('#agendamentoFormContainer').addClass('d-none'); // Esconde o formulário após sucesso
                $('#listaAgendamentos').removeClass('d-none'); // Exibe a lista de agendamentos
                
                // Recarregar a lista de agendamentos sem precisar recarregar a página
                // Aqui você pode adicionar código para atualizar dinamicamente a lista de agendamentos sem recarregar a página
                location.reload(); // Recarrega a página para exibir o novo agendamento
            },
            error: function(xhr, status, error) {
                alert('Erro ao criar agendamento');
            },
            complete: function() {
                // Reabilita o botão de envio após a requisição AJAX
                $('#agendamentoForm button[type="submit"]').prop('disabled', false); 
                $('#agendamentoForm button[type="submit"]').text('Salvar Agendamento'); // Restaura o texto original
            }
        });
    });
});

// Define a data e hora mínima como o momento atual
var currentDateTime = new Date().toISOString().slice(0, 16); // Obtém a data e hora atual no formato "YYYY-MM-DDTHH:MM"

// Aplica a data mínima nos campos de Data e Hora
$('#dataHora').attr('min', currentDateTime);  // No formulário de agendamento
$('#editDataHora').attr('min', currentDateTime); // No formulário de edição (se necessário)

function formatDate(dateString) {
    const date = new Date(dateString);

    // Obtém os componentes da data
    const day = String(date.getDate()).padStart(2, '0');  // Dia
    const month = String(date.getMonth() + 1).padStart(2, '0');  // Mês (começa do 0)
    const year = String(date.getFullYear()).slice(2);  // Ano (2 últimos dígitos)
    const hours = String(date.getHours()).padStart(2, '0');  // Hora
    const minutes = String(date.getMinutes()).padStart(2, '0');  // Minutos

    // Retorna o formato "DD/MM/YY às HH:mm"
    return `${day}/${month}/${year} às ${hours}:${minutes}`;
}

// Formatar todas as datas na tabela de agendamentos
$('#agendamentosList tr').each(function() {
    const dataHoraCell = $(this).find('td:nth-child(2)');  // 2ª coluna (Data e Hora)
    const dataHoraText = dataHoraCell.text();  // Obtém o texto da célula
    const formattedDate = formatDate(dataHoraText);  // Formata a data
    dataHoraCell.text(formattedDate);  // Substitui o texto da célula pela data formatada
});

// Formatar a data e hora do campo "Data e Hora" no formulário de agendamento
$('#agendamentoForm input[type="datetime-local"]').on('input', function() {
    const inputDate = $(this).val();  // Obtém o valor do campo de data e hora
    const formattedDate = formatDate(inputDate);  // Formata a data
    console.log(formattedDate);  // Exibe no console ou use para algum campo de visualização
});

// Submeter o formulário de edição via AJAX
$('#editarAgendamentoForm').submit(function(e) {
    e.preventDefault();

    const formData = $(this).serialize();  // Coleta os dados do formulário

    // Requisição AJAX para editar o agendamento
    $.ajax({
        url: '/agendamentos/' + $('#editAgendamentoId').val(),  // ID do agendamento
        method: 'PUT',
        data: formData,
        success: function(response) {
            alert('Agendamento atualizado com sucesso!');
            //location.reload(); // Recarregar a página para refletir a alteração
        },
        error: function() {
            alert('Erro ao editar agendamento.');
        }
    });
});

// Função para excluir agendamento
$('.delete-agendamento').on('click', function(e) {
    e.preventDefault();

    var agendamentoId = $(this).data('id'); // Obtém o id do agendamento

    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
        $.ajax({
            type: 'DELETE',
            url: '/agendamentos/' + agendamentoId, // Envia o ID do agendamento para a rota de exclusão
            success: function(response) {
                alert('Agendamento excluído com sucesso');
                location.reload(); // Recarrega a página para atualizar a lista de agendamentos
            },
            error: function(xhr, status, error) {
                alert('Erro ao excluir agendamento');
            }
        });
    }
});

// Abrir o modal de filtro
$('#filtroAgendamentoForm').submit(function(e) {
    e.preventDefault();

    // Coleta os valores dos campos de filtro
    var empresaFiltro = $('#filtroEmpresa').val().toLowerCase(); // Nome da empresa (case-insensitive)
    var dataFiltro = $('#filtroData').val(); // Data do agendamento (YYYY-MM-DD)

    // Filtra os agendamentos
    $('#agendamentosList tr').each(function() {
        var empresa = $(this).find('td').eq(0).text().toLowerCase(); // Nome da empresa
        var dataHora = $(this).find('td').eq(1).text(); // Data e hora (completo)
        var dataAgendamento = formatarDataParaFiltro(dataHora); // Converte a data para o formato YYYY-MM-DD

        // Lógica de filtro
        var mostraAgendamento = true;

        // Filtro por nome da empresa (se for preenchido)
        if (empresaFiltro && !empresa.includes(empresaFiltro)) {
            mostraAgendamento = false;
        }

        // Filtro por data (se for preenchido)
        if (dataFiltro && dataFiltro !== dataAgendamento) {
            mostraAgendamento = false;
        }

        // Exibe ou oculta o agendamento com base no filtro
        if (mostraAgendamento) {
            $(this).show();
        } else {
            $(this).hide();
        }
    });

    // Fechar o modal após aplicar o filtro
    $('#filtroAgendamentoModal').modal('hide');
});

// Função para formatar a data de exibição para o formato YYYY-MM-DD
function formatarDataParaFiltro(dataHora) {
    // Exemplo de data: "31/12/2024 às 14:50"
    var dataPartes = dataHora.split(' às ')[0]; // Pega a parte da data
    var dataArray = dataPartes.split('/'); // Divide a data em partes [DD, MM, AAAA]
    var ano = dataArray[2];
    var mes = dataArray[1].padStart(2, '0'); // Adiciona 0 à frente se o mês for menor que 10
    var dia = dataArray[0].padStart(2, '0'); // Adiciona 0 à frente se o dia for menor que 10

    // Retorna a data no formato YYYY-MM-DD
    return ano + '-' + mes + '-' + dia;
}

document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/posvendas')
        .then(response => response.json())
        .then(data => {
            const empresaSelect = document.getElementById('empresa');
            empresaSelect.innerHTML = '';
            data.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.id;
                option.text = cliente.nomeCliente;
                empresaSelect.appendChild(option);
            });
        });

    fetch('/api/clientesfrts')
        .then(response => response.json())
        .then(data => {
            const empresaSelect = document.getElementById('empresa');
            empresaSelect.innerHTML = '';
            data.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.id;
                option.text = cliente.nomeCliente;
                empresaSelect.appendChild(option);

                empresaSelect.addEventListener('change', function() {
                    const selectedCliente = data.find(cliente => cliente.id == this.value);
                    const frotaSelect = document.getElementById('frota');
                    frotaSelect.innerHTML = '';
                    const option = document.createElement('option');
                    option.value = selectedCliente.frotaModelo;
                    option.text = selectedCliente.frotaModelo;
                    frotaSelect.appendChild(option);
                });
            });
        });
});