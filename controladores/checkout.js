const fs = require("fs");
dados = fs.readFileSync("./data/data.json").toString();
const listaProdutos = JSON.parse(dados);
const { addBusinessDays } = require("date-fns");

const carrinho = {
    subtotal: 0,
    dataDeEntrega: null,
    valorDoFrete: 0,
    totalAPagar: 0,
    produtos: [],
};

function listarProdutos(req, res) {
    if (!req.query.categoria && !req.query.precoInicial && !req.query.precoFinal){
        
        console.log("Listando produtos sem filtro.")
        res.json(listaProdutos.produtos);
    };
    if (req.query.categoria && req.query.precoInicial && req.query.precoFinal) {
        const listaPorCategoria = listaProdutos.produtos.filter( categoria => categoria.categoria === req.query.categoria);
        const listaPorPreco = listaPorCategoria.filter( preco => Number(req.query.precoInicial) > Number(x.preco) < Number(req.query.precoFinal));
        const listaPorCategoriaPrecoEstoque = listaPorPreco.filter(estoque => estoque.estoque !== 0);

        console.log("Filtrando por preço e categoria.");
        res.json(listaPorCategoriaPrecoEstoque);
    }
    if (req.query.categoria && !req.query.precoInicial && !req.query.precoFinal) {
        const listaPorCategoria = listaProdutos.produtos.filter( categoria => categoria.categoria === req.query.categoria);
        const listaPorCategoriaEstoque = listaPorCategoria.filter(estoque => estoque.estoque !== 0);
        
        console.log("Filtrando por categoria.");
        res.json(listaPorCategoriaEstoque);
    };
    if (!req.query.categoria && req.query.precoInicial && req.query.precoFinal) {
        const precoAcima = listaProdutos.produtos.filter( preco => preco.preco > Number(req.query.precoInicial))
        const precoAbaixo = precoAcima.filter(preco => preco.preco < Number(req.query.precoFinal));
        const listaPorPrecoEstoque = precoAbaixo.filter(estoque => estoque.estoque !== 0);

        console.log("Filtrando por preço.");
        res.json(listaPorPrecoEstoque);
    };
};

function consultarCarrinho(req, res) {
    res.json(carrinho);
};

function checarEstoque (checar, checando) {
    const variavel = checar.find(
        (produto) => produto.id === checando);
        return variavel;
};

function atualizarCarrinho() {
    let subtotal = 0;
    carrinho.produtos.forEach(
        produto => {
            subtotal += produto.quantidade * produto.preco
        }
    );
    carrinho.subtotal = subtotal;
    carrinho.dataDeEntrega = addBusinessDays(new Date(), {days: 15});
    if (carrinho.subtotal < 200*100) {
        carrinho.valorDoFrete = 50*100;
    } else {
        carrinho.valorDoFrete = 0;
    };  
    carrinho.totalAPagar = carrinho.valorDoFrete + carrinho.subtotal;
};

function adcProdutoCarrinho (req, res) {
    const Produto = listaProdutos.produtos.find( 
        (item) => item.id === (Number(req.body.id))
    );
    
    if (carrinho.produtos.find( item => item.id === Produto.id)) {
        res.json({ mensagem: "Item já presente no carrinho."});
    } else {
        if (Produto.estoque >= req.body.quantidade) {
            const produto = {
                id: Produto.id,
                quantidade: req.body.quantidade,
                nome: Produto.nome,
                preco: Produto.preco,
                categoria: Produto.categoria
            }; 
    
            carrinho.produtos.push(produto);
            atualizarCarrinho();
        } else {
            res.json({ mensagem: "Quantidade pedida superior a presente no estoque."})
        };

    };

    res.json(carrinho);
};

function alterarProdutoCarrinho (req, res) {
    const Produto = checarEstoque(carrinho.produtos, Number(req.params.idProduto));

    if (carrinho.produtos.length < 1) {
        res.json({ mensagem: "O carrinho está vazio."})
    };
    if (carrinho.produtos.find( item => item.id !== Number(req.params.idProduto))) {
        res.json({ mensagem: "Item não está no carrinho."});
    } else {
        const variavel = checarEstoque(listaProdutos.produtos, Number(req.params.idProduto));
        if (Produto.quantidade < 0) {
            const retirarProduto = checarEstoque(carrinho.produtos, Number(req.params.idProduto));
            const indice = carrinho.produtos.indexOf(retirarProduto);
            carrinho.produtos.splice(indice, 1);
        }
        if (variavel.estoque >= (Produto.quantidade + req.body.quantidade)) {
            Produto.quantidade += req.body.quantidade;        
        } else {
            res.json({ mensagem: "Quantidade fora do estoque."})
        
        }
    }

    atualizarCarrinho();
    res.json(Produto);

};

function removerProdutoCarrinho(req, res) {
    const Produto = checarEstoque(carrinho.produtos, Number(req.params.idProduto));
    
    const indice = carrinho.produtos.indexOf(Produto);

    carrinho.produtos.splice(indice, 1)
    atualizarCarrinho();
    res.json(Produto);
};

function zerarCarrinho(req, res) {
    carrinho.produtos = [];
    carrinho.subtotal = 0;
    carrinho.totalAPagar = 0;
    carrinho.valorDoFrete = 0;
    carrinho.dataDeEntrega = null;
    res.json({mensagem: "O carrinho foi limpo com sucesso."})
};

function finalizarCompra (req, res) {
    let tudoOk = true;
    
    if (carrinho.produtos.length === 0) {
        tudoOk = false;
        res.json({ mensagem: "O carrinho está vazio."})
    } else if (carrinho.produtos.length >= 1) {
        carrinho.produtos.forEach( produto => {
            let verificar = checarEstoque(listaProdutos.produtos, produto.id);
            if (verificar.estoque < produto.quantidade) {
                res.json( { mensagem: "Quantidade pedida é superior a presente no estoque!"});
                tudoOk = false;
            }
        });
    };
    if (req.body.type !== "individual") {
        tudoOk = false;
        res.json({ mensagem: "Tipo de usuario não habilitado."})
    };
    if (req.body.country.length !== 2) {
        tudoOk = false;
        res.json({ mensagem: "Campo country deve conter 2 letras."})
    };
    if (!req.body.name.includes(" ")) {
        tudoOk = false;
        res.json( { mensagem: "Nome e Sobrenome obrigatorio."})
    };
    if (req.body.documents[0].type !== "cpf") {
        tudoOk = false;
        res.json( { mensagem: "CPF obrigatorio."})
    };
    if (req.body.documents[0].number.length !== 11) {
        tudoOk = false;
        res.json( { mensagem: "CPF inválido, min 11 números."})
    };

    if (tudoOk) {
        res.json(carrinho);
        zerarCarrinho();
    };
    
};

module.exports = { 
    consultarCarrinho, 
    zerarCarrinho, 
    listarProdutos, 
    removerProdutoCarrinho, 
    alterarProdutoCarrinho, 
    adcProdutoCarrinho, 
    atualizarCarrinho,
    finalizarCompra,
};