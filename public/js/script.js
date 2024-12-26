// Função para alternar entre mostrar o formulário de agendamento e a lista de agendamentos
document.getElementById('agendamentoLink').addEventListener('click', function (e) {
    e.preventDefault();
    const agendamentoFormContainer = document.getElementById('agendamentoFormContainer');
    const listaAgendamentos = document.getElementById('listaAgendamentos');
    
    // Alterna entre mostrar o formulário e a lista de agendamentos
    if (agendamentoFormContainer.classList.contains('d-none')) {
        agendamentoFormContainer.classList.remove('d-none');
        listaAgendamentos.classList.add('d-none');
    } else {
        agendamentoFormContainer.classList.add('d-none');
        listaAgendamentos.classList.remove('d-none');
    }
});

// Submeter o formulário de agendamento via AJAX
$(document).ready(function() {
    $('#agendamentoForm').submit(function(e) {
        e.preventDefault();

        var formData = $(this).serialize();

        $.ajax({
            type: 'POST',
            url: '/agendamentos', // Certifique-se de que a rota no servidor está correta
            data: formData,
            success: function(response) {
                alert('Agendamento criado com sucesso');
                $('#agendamentoFormContainer').addClass('d-none'); // Esconde o formulário após sucesso
                $('#listaAgendamentos').removeClass('d-none'); // Exibe a lista de agendamentos
                // Recarrega a lista de agendamentos, se necessário
                // Exemplo: atualizar a lista de agendamentos com os dados do servidor
                location.reload(); // Recarrega a página para exibir o novo agendamento
            },
            error: function(xhr, status, error) {
                alert('Erro ao criar agendamento');
            }
        });
    });
});
