"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useGame } from "@/lib/store";
import { catalog, checkAnswer, type ItemId } from "@/lib/rpg";

const GameWorld = dynamic(() => import("@/components/GameWorld"), {
  ssr: false,
  loading: () => <p>Preparando Pedra da Aurora...</p>,
});

type Panel = "none" | "shop" | "bag" | "mission" | "hero";

export default function Home() {
  const hero = useGame(s => s.hero);
  const buy = useGame(s => s.buy);
  const equip = useGame(s => s.equip);
  const answerMission = useGame(s => s.answer);

  const [ready, setReady] = useState(false);
  const [panel, setPanel] = useState<Panel>("none");
  const [answer, setAnswer] = useState("");
  const [nearby, setNearby] = useState<"shop" | "mentor" | null>(null);
  const appearance = useGame(s => s.appearance);
  const setArmor = useGame(s => s.setArmor);
  const setBeard = useGame(s => s.setBeard);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    void Promise.resolve(useGame.persist.rehydrate()).then(() => setReady(true));
  }, []);

  const items = Object.keys(catalog) as ItemId[];

  if (!ready) {
    return <main className="loading">Carregando sua jornada...</main>;
  }

  function submit() {
    if (hero.missionComplete) return;
    const correct = checkAnswer(answer);
    answerMission(answer);

    setFeedback(correct
      ? "Correto! Missao concluida: +100 XP e +20 ouro."
      : "Ainda nao. Declare a variavel nivel com valor 1 e ponto e virgula.");
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <small>EVOLUTION LAB RPG</small>
          <h1>GENESIS REBORN</h1>
        </div>
        <div className="stats">
          <span>Nivel {hero.level}</span>
          <span>{hero.xp} XP</span>
          <span>{hero.gold} ouro</span>
        </div>
      </header>

      <div className="layout">
        <section className="world">
          <GameWorld
            openShop={() => setPanel("shop")}
            openMission={() => setPanel("mission")}
            proximity={setNearby}
          />
          <div className="hint">
            WASD / setas: mover | E: interagir quando estiver proximo
          </div>
        </section>

        <aside className="sidebar">
          <small>CAPITULO I</small>
          <h2>Pedra da Aurora</h2>
          <p>
            Um jovem guerreiro chega a cidade para aprender
            as linguagens que governam o mundo.
          </p>
          <button onClick={() => setPanel("mission")}>
            A Linguagem das Runas
          </button>
          <button onClick={() => setPanel("shop")}>
            Loja do Mercador
          </button>
          <button onClick={() => setPanel("hero")}>
            Personalizar Guerreiro
          </button>
          <button onClick={() => setPanel("bag")}>
            Inventario ({hero.inventory.length})
          </button>

          {nearby && (
            <p className="nearby">
              Pressione E para interagir com {nearby === "shop" ? "o Mercador" : "o Mestre das Runas"}.
            </p>
          )}

          <div className="quest">
            <strong>Missao principal</strong>
            <p>{hero.missionComplete
              ? "Concluida - 100 XP conquistados."
              : "Aprender a declarar uma variavel JavaScript."}</p>
          </div>

          <small>Salvamento automatico neste navegador.</small>
        </aside>
      </div>

      {panel !== "none" && (
        <div className="overlay">
          <section className="dialog" role="dialog"
            aria-modal="true" aria-label="Painel de jogo">
            <button className="close" onClick={() => setPanel("none")}>
              Fechar
            </button>

            {panel === "hero" && (
              <>
                <h2>Personalizar Guerreiro</h2>
                <p>Escolha a aparencia do seu anao.</p>

                <label htmlFor="armor">Cor da armadura</label>
                <select id="armor" value={appearance.armor}
                  onChange={e => setArmor(e.target.value as "blue" | "red" | "green")}>
                  <option value="blue">Azul da Aurora</option>
                  <option value="red">Vermelho da Forja</option>
                  <option value="green">Verde do Vale</option>
                </select>

                <label htmlFor="beard">Cor da barba</label>
                <select id="beard" value={appearance.beard}
                  onChange={e => setBeard(e.target.value as "copper" | "brown" | "silver")}>
                  <option value="copper">Cobre</option>
                  <option value="brown">Castanho</option>
                  <option value="silver">Prata</option>
                </select>

                <p>As escolhas sao salvas automaticamente.</p>
              </>
            )}

            {panel === "shop" && (
              <>
                <h2>Mercador da Aurora</h2>
                <p>Seu ouro: {hero.gold}</p>
                {items.map(item => (
                  <div className="item" key={item}>
                    <span>{catalog[item].name} — {catalog[item].price} ouro</span>
                    <button
                      disabled={
                        hero.inventory.includes(item) ||
                        hero.gold < catalog[item].price
                      }
                      onClick={() => buy(item)}
                    >
                      {hero.inventory.includes(item)
                        ? "Adquirido" : "Comprar"}
                    </button>
                  </div>
                ))}
              </>
            )}

            {panel === "bag" && (
              <>
                <h2>Inventario</h2>
                {hero.inventory.length === 0 && <p>Inventario vazio.</p>}
                {hero.inventory.map(item => (
                  <div className="item" key={item}>
                    <span>{catalog[item].name}</span>
                    <button
                      disabled={hero.equipped.includes(item)}
                      onClick={() => equip(item)}
                    >
                      {hero.equipped.includes(item)
                        ? "Equipado" : "Equipar"}
                    </button>
                  </div>
                ))}
              </>
            )}

            {panel === "mission" && (
              <>
                <h2>A Linguagem das Runas</h2>
                <p>
                  Em JavaScript, uma variavel armazena informacoes.
                  Usamos <code>let</code> para declarar uma variavel
                  cujo valor pode mudar.
                </p>
                <p>
                  <strong>Desafio:</strong> declare uma variavel
                  chamada <code>nivel</code> com valor numerico
                  <code>1</code>.
                </p>
                <label htmlFor="code">Seu codigo JavaScript</label>
                <textarea
                  id="code"
                  rows={4}
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="let nivel = 1;"
                  disabled={hero.missionComplete}
                />
                <button onClick={submit}
                  disabled={hero.missionComplete}>
                  Verificar resposta
                </button>
                <p aria-live="polite">
                  {hero.missionComplete
                    ? "Missao concluida! Recompensa recebida."
                    : feedback}
                </p>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}