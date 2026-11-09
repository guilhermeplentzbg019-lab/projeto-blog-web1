// carrega os bagulhos do localstorage ou bota o admin padrao se estiver vazio
let usuarios = recuperarRegistros("blog_usuarios")
if (!usuarios) {
    usuarios = [
        {
            id: 1,
            nome: "Batman (Admin)",
            email: "admin@batman.com",
            senha: "123",
            foto: "img/admin.jpg",
            isAdmin: true
        }
    ]
    persistir("blog_usuarios", usuarios)
}

let usuarioLogado = recuperarRegistros("blog_usuario_logado")

let posts = recuperarRegistros("blog_posts")
if (!posts) {
    posts = [
        {
            id: 1,
            titulo: "Patrulha noturna concluída",
            texto: "Mais uma noite calma em Gotham. Todos os sistemas funcionando perfeitamente.",
            imagem: "",
            autorNome: "Batman (Admin)",
            autorFoto: "img/admin.jpg",
            curtidas: 5,
            comentarios: [
                {
                    id: 1,
                    autorNome: "Robin",
                    autorFoto: "img/avatar.png",
                    texto: "Boa, chefe! Qual é o plano de amanhã?",
                    curtidas: 2,
                    respostas: [
                        {
                            id: 101,
                            autorNome: "Batman (Admin)",
                            autorFoto: "img/admin.jpg",
                            texto: "Reunião na Batcaverna às 22h."
                        }
                    ]
                }
            ]
        }
    ]
    persistir("blog_posts", posts)
}

// funcao de salvar no localstorage
function persistir(chave, valor) {
    localStorage.setItem(chave, JSON.stringify(valor))
}

// funcao de resgatar do localstorage
function recuperarRegistros(chave) {
    const dados = localStorage.getItem(chave)
    return dados ? JSON.parse(dados) : null
}

// leitor de arquivo pra transformar a imagem do pc em base64 (jeito mais facil sem backend)
let fotoPerfilTemp = "img/avatar.png";
let fotoPostTemp = "";

function configurarLeitoresDeArquivos() {
    const inputPerfil = document.getElementById("regArquivoFoto");
    if (inputPerfil) {
        inputPerfil.addEventListener("change", function(evento) {
            const arquivo = evento.target.files[0];
            if (arquivo) {
                const leitor = new FileReader();
                leitor.onload = function(e) {
                    fotoPerfilTemp = e.target.result;
                };
                leitor.readAsDataURL(arquivo);
            }
        });
    }

    const inputPost = document.getElementById("postArquivoFoto");
    if (inputPost) {
        inputPost.addEventListener("change", function(evento) {
            const arquivo = evento.target.files[0];
            if (arquivo) {
                const leitor = new FileReader();
                leitor.onload = function(e) {
                    fotoPostTemp = e.target.result;
                };
                leitor.readAsDataURL(arquivo);
            }
        });
    }
}

// sistema de cadastro
function cadastrarUsuario() {
    const nome = document.getElementById("regNome").value.trim()
    const email = document.getElementById("regEmail").value.trim()
    const senha = document.getElementById("regSenha").value.trim()

    if (nome === "" || email === "" || senha === "") {
        alert("Preencha tudo ae mano!")
        return
    }

    const novoId = usuarios.length > 0 ? usuarios[usuarios.length - 1].id + 1 : 1
    const novoUsuario = {
        id: novoId,
        nome: nome,
        email: email,
        senha: senha,
        foto: fotoPerfilTemp,
        isAdmin: false
    }

    usuarios.push(novoUsuario)
    persistir("blog_usuarios", usuarios)

    usuarioLogado = novoUsuario
    persistir("blog_usuario_logado", usuarioLogado)

    alert("Conta criada com sucesso!")
    location.reload()
}

// sistema de login basicao
function fazerLogin() {
    const email = document.getElementById("loginEmail").value.trim()
    const senha = document.getElementById("loginSenha").value.trim()

    const u = usuarios.find(user => user.email === email && user.senha === senha)

    if (u) {
        usuarioLogado = u
        persistir("blog_usuario_logado", usuarioLogado)
        location.reload()
    } else {
        alert("E-mail ou senha errados!")
    }
}

// deslogar o usuario
function fazerLogout() {
    localStorage.removeItem("blog_usuario_logado")
    usuarioLogado = null
    location.reload()
}

// criar post novo (so o admin consegue)
function criarPost() {
    if (!usuarioLogado || !usuarioLogado.isAdmin) {
        alert("Apenas o Batman pode postar aqui!")
        return
    }

    const titulo = document.getElementById("postTitulo").value.trim()
    const texto = document.getElementById("postTexto").value.trim()

    if (titulo === "" || texto === "") {
        alert("Escreve alguma coisa pelo menos nos pvt")
        return
    }

    const novoId = posts.length > 0 ? posts[posts.length - 1].id + 1 : 1
    const novoPost = {
        id: novoId,
        titulo: titulo,
        texto: texto,
        imagem: fotoPostTemp,
        autorNome: usuarioLogado.nome,
        autorFoto: usuarioLogado.foto,
        curtidas: 0,
        comentarios: []
    }

    posts.unshift(novoPost)
    persistir("blog_posts", posts)

    document.getElementById("formPost").reset()
    fotoPostTemp = ""

    renderizarFeed()
}

// dar like no post
function curtirPost(postId) {
    const p = posts.find(item => item.id === postId)
    if (p) {
        p.curtidas += 1
        persistir("blog_posts", posts)
        renderizarFeed()
    }
}

// apagar post (admin manda)
function excluirPost(postId) {
    if (!usuarioLogado || !usuarioLogado.isAdmin) return

    const index = posts.findIndex(item => item.id === postId)
    if (index !== -1) {
        posts.splice(index, 1)
        persistir("blog_posts", posts)
        renderizarFeed()
    }
}

// comentar no post
function adicionarComentario(postId) {
    if (!usuarioLogado) {
        alert("Faz login ai pra comentar!")
        return
    }

    const campo = document.getElementById(`input-comentario-${postId}`)
    if (!campo) return

    const texto = campo.value.trim()
    if (texto === "") return

    const p = posts.find(item => Number(item.id) === Number(postId))
    if (p) {
        if (!p.comentarios) p.comentarios = []

        const novoComentario = {
            id: Date.now(),
            autorNome: usuarioLogado.nome,
            autorFoto: usuarioLogado.foto,
            texto: texto,
            curtidas: 0,
            respostas: []
        }

        p.comentarios.push(novoComentario)
        persistir("blog_posts", posts)
        renderizarFeed()
    }
}

// curtir comentario
function curtirComentario(postId, comentId) {
    const p = posts.find(item => item.id === postId)
    if (p) {
        const c = p.comentarios.find(item => item.id === comentId)
        if (c) {
            c.curtidas += 1
            persistir("blog_posts", posts)
            renderizarFeed()
        }
    }
}

// apagar comentario (admin)
function excluirComentario(postId, comentId) {
    if (!usuarioLogado || !usuarioLogado.isAdmin) return

    const p = posts.find(item => item.id === postId)
    if (p) {
        const index = p.comentarios.findIndex(item => item.id === comentId)
        if (index !== -1) {
            p.comentarios.splice(index, 1)
            persistir("blog_posts", posts)
            renderizarFeed()
        }
    }
}

// abrir a caixinha de responder comentario
function alternarCaixaResposta(comentId) {
    if (!usuarioLogado) {
        alert("Precisa estar logado!")
        return
    }
    const caixa = document.getElementById(`caixa-resposta-${comentId}`)
    if (caixa) {
        caixa.classList.toggle("d-none")
    }
}

// mandar a resposta no comentario de alguem
function responderComentario(postId, comentId) {
    if (!usuarioLogado) return

    const campo = document.getElementById(`input-resposta-${comentId}`)
    if (!campo) return

    const texto = campo.value.trim()
    if (texto === "") return

    const p = posts.find(item => Number(item.id) === Number(postId))
    if (p) {
        const c = p.comentarios.find(item => Number(item.id) === Number(comentId))
        if (c) {
            if (!c.respostas) c.respostas = []

            const novaResposta = {
                id: Date.now(),
                autorNome: usuarioLogado.nome,
                autorFoto: usuarioLogado.foto,
                texto: texto
            }

            c.respostas.push(novaResposta)
            persistir("blog_posts", posts)
            renderizarFeed()
        }
    }
}

// deletar resposta aninhada
function excluirResposta(postId, comentId, respId) {
    if (!usuarioLogado || !usuarioLogado.isAdmin) return

    const p = posts.find(item => Number(item.id) === Number(postId))
    if (p) {
        const c = p.comentarios.find(item => Number(item.id) === Number(comentId))
        if (c && c.respostas) {
            const index = c.respostas.findIndex(item => Number(item.id) === Number(respId))
            if (index !== -1) {
                c.respostas.splice(index, 1)
                persistir("blog_posts", posts)
                renderizarFeed()
            }
        }
    }
}

// renderiza todo o feed na tela mexendo no dom
function renderizarFeed() {
    const feed = document.getElementById("feedPosts")
    if (!feed) return
    let html = ""

    posts.forEach(p => {
        let tagImagem = p.imagem ? `<img src="${p.imagem}" class="img-fluid rounded my-2 style-post-img" alt="Foto do post">` : ""

        let btnDeletarPost = (usuarioLogado && usuarioLogado.isAdmin) 
            ? `<button class="btn btn-sm btn-outline-danger" onclick="excluirPost(${p.id})">Excluir Post</button>` 
            : ""

        let htmlComentarios = ""
        p.comentarios.forEach(c => {
            let btnExcluirComent = (usuarioLogado && usuarioLogado.isAdmin) 
                ? `<button class="btn btn-link text-danger btn-sm p-0 ms-2" onclick="excluirComentario(${p.id}, ${c.id})">Excluir</button>` 
                : ""

            let htmlRespostas = ""
            if (c.respostas && c.respostas.length > 0) {
                c.respostas.forEach(r => {
                    let btnExcluirResp = (usuarioLogado && usuarioLogado.isAdmin)
                        ? `<button class="btn btn-link text-danger btn-sm p-0 ms-2" onclick="excluirResposta(${p.id}, ${c.id}, ${r.id})">Excluir</button>`
                        : ""

                    htmlRespostas += `
                        <div class="d-flex align-items-start gap-2 mt-2 ps-4 border-start border-warning">
                            <img src="${r.autorFoto}" class="rounded-circle" width="26" height="26" style="object-fit:cover;">
                            <div class="w-100">
                                <div class="d-flex justify-content-between align-items-center">
                                    <strong class="text-warning" style="font-size: 0.8rem;">${r.autorNome}</strong>
                                    ${btnExcluirResp}
                                </div>
                                <p class="mb-1 text-white-50" style="font-size: 0.8rem;">${r.texto}</p>
                            </div>
                        </div>
                    `
                })
            }

            let botaoResponder = usuarioLogado ? `
                <button class="btn btn-link text-warning btn-sm p-0 ms-3" onclick="alternarCaixaResposta(${c.id})" style="font-size: 0.75rem; text-decoration:none;">
                    💬 Responder
                </button>
            ` : ""

            let inputRespostaBox = usuarioLogado ? `
                <div id="caixa-resposta-${c.id}" class="d-none mt-2 ps-4">
                    <div class="d-flex gap-2">
                        <input type="text" id="input-resposta-${c.id}" class="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Escreva sua resposta...">
                        <button class="btn btn-sm btn-warning fw-bold" onclick="responderComentario(${p.id}, ${c.id})">Enviar</button>
                    </div>
                </div>
            ` : ""

            htmlComentarios += `
                <div class="mb-3 p-2 rounded bg-black border border-secondary">
                    <div class="d-flex align-items-start gap-2">
                        <img src="${c.autorFoto}" class="rounded-circle" width="32" height="32" style="object-fit:cover;">
                        <div class="w-100">
                            <div class="d-flex justify-content-between align-items-center">
                                <strong class="text-light" style="font-size: 0.9rem;">${c.autorNome}</strong>
                                ${btnExcluirComent}
                            </div>
                            <p class="mb-1 text-white-50" style="font-size: 0.85rem;">${c.texto}</p>
                            <div class="d-flex align-items-center">
                                <button class="btn btn-link text-warning btn-sm p-0" onclick="curtirComentario(${p.id}, ${c.id})" style="font-size: 0.75rem; text-decoration:none;">
                                    👍 Curtir (${c.curtidas})
                                </button>
                                ${botaoResponder}
                            </div>
                        </div>
                    </div>
                    <div class="mt-2">
                        ${htmlRespostas}
                        ${inputRespostaBox}
                    </div>
                </div>
            `
        })

        let blocoInputComentario = usuarioLogado ? `
            <div class="d-flex gap-2 mt-3">
                <input type="text" id="input-comentario-${p.id}" class="form-control bg-dark text-white border-secondary" placeholder="Escreva um comentário...">
                <button class="btn btn-warning fw-bold" onclick="adicionarComentario(${p.id})">Enviar</button>
            </div>
        ` : `<p class="text-white-50 mt-3" style="font-size: 0.85rem;">Faça login para comentar neste post.</p>`

        html += `
            <div class="card bg-dark text-white border-secondary mb-4 shadow">
                <div class="card-header bg-black border-secondary d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center gap-2">
                        <img src="${p.autorFoto}" class="rounded-circle" width="40" height="40" style="object-fit:cover;">
                        <div>
                            <h6 class="mb-0 text-white">${p.autorNome}</h6>
                            <small class="text-white-50">${p.titulo}</small>
                        </div>
                    </div>
                    ${btnDeletarPost}
                </div>
                <div class="card-body">
                    <p class="card-text">${p.texto}</p>
                    ${tagImagem}
                    <div class="mt-3 pt-2 border-top border-secondary d-flex align-items-center gap-3">
                        <button class="btn btn-outline-warning btn-sm" onclick="curtirPost(${p.id})">
                            👍 Curtir (${p.curtidas})
                        </button>
                    </div>
                </div>
                <div class="card-footer bg-black border-secondary">
                    <h6>Comentários</h6>
                    ${htmlComentarios || '<p class="text-white-50" style="font-size: 0.85rem;">Nenhum comentário ainda.</p>'}
                    ${blocoInputComentario}
                </div>
            </div>
        `
    })

    feed.innerHTML = html
}

// atualiza o header dependendo se o cara ta logado ou nao
function atualizarHeader() {
    const divUser = document.getElementById("divUsuarioHeader")
    const divCriarPost = document.getElementById("containerCriarPost")

    if (usuarioLogado) {
        divUser.innerHTML = `
            <div class="d-flex align-items-center gap-2">
                <img src="${usuarioLogado.foto}" class="rounded-circle" width="35" height="35" style="object-fit:cover;">
                <span class="text-light fw-bold">${usuarioLogado.nome}</span>
                <button class="btn btn-sm btn-outline-danger ms-2" onclick="fazerLogout()">Sair</button>
            </div>
        `
        if (divCriarPost) {
            if (usuarioLogado.isAdmin) {
                divCriarPost.classList.remove("d-none")
            } else {
                divCriarPost.classList.add("d-none")
            }
        }
    } else {
        if (divUser) {
            divUser.innerHTML = `
                <button class="btn btn-outline-light btn-sm me-2" data-bs-toggle="modal" data-bs-target="#modalLogin">Entrar</button>
                <button class="btn btn-warning btn-sm fw-bold" data-bs-toggle="modal" data-bs-target="#modalRegistro">Criar Conta</button>
            `
        }
        if (divCriarPost) {
            divCriarPost.classList.add("d-none")
        }
    }
}