const express = require("express");
const controladorCheckout = require("./controladores/checkout");

const roteador = express();

roteador.get("/produtos", controladorCheckout.listarProdutos);
roteador.get("/carrinho", controladorCheckout.consultarCarrinho);
roteador.post("/carrinho/produtos/", controladorCheckout.adcProdutoCarrinho);
roteador.patch("/carrinho/produtos/:idProduto", controladorCheckout.alterarProdutoCarrinho);
roteador.delete("/carrinho/produtos/:idProduto", controladorCheckout.removerProdutoCarrinho);
roteador.delete("/carrinho", controladorCheckout.zerarCarrinho);
roteador.post("/finalizar-compra", controladorCheckout.finalizarCompra);

module.exports = roteador;
