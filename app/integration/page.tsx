/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

// Page de guides d'intégration HCS-U7.
// IMPORTANT :
// - Aucune clé réelle n'est utilisée ici.
// - Tous les exemples utilisent des placeholders (YOUR_HCS_U7_API_KEY, etc.).
// - Cette page ne lit ni variables d'environnement, ni base de données.

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
      <code className="whitespace-pre-wrap wrap-break-word font-mono">
        {children}
      </code>
    </pre>
  );
}

export default function IntegrationPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 text-slate-800">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          Guides d'intégration HCS-U7 (API)
        </h1>
        <p className="text-sm text-slate-600">
          Cette page décrit comment consommer l'API HCS-U7 depuis vos backends.
          Tous les exemples utilisent des valeurs d'exemple et des placeholders.
          Vous ne devez jamais coller de clé réelle dans votre frontend ou dans
          ce dépôt.
        </p>
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <p className="font-semibold">Sécurité &amp; secrets</p>
          <ul className="mt-1 list-disc pl-4">
            <li>
              Stockez votre clé HCS-U7 uniquement dans des variables
              d'environnement côté serveur (ex : HCS_U7_API_KEY).
            </li>
            <li>
              Ne committez jamais de secrets dans Git, ni dans ce repository
              d'admin.
            </li>
            <li>
              Les exemples ci-dessous utilisent uniquement des placeholders du
              type <code className="font-mono">YOUR_HCS_U7_API_KEY</code>.
            </li>
          </ul>
        </div>
      </header>

      {/* Section 1 : Vue d'ensemble */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Vue d'ensemble</h2>
        <p className="text-sm text-slate-700">
          L'API HCS-U7 est accessible via HTTPS avec des requêtes JSON
          authentifiées par clé API. Les exemples ci-dessous illustrent un
          schéma classique d'utilisation de deux endpoints principaux :
        </p>
        <ul className="list-disc pl-5 text-sm text-slate-700">
          <li>
            <code className="font-mono text-xs">POST /v1/verify</code> :
            vérifier un code HCS-U7.
          </li>
          <li>
            <code className="font-mono text-xs">POST /v1/generate</code> :
            générer un code HCS-U7.
          </li>
        </ul>
        <p className="text-xs text-slate-500">
          Les noms d'URL et les schémas JSON utilisés ici sont des exemples et
          doivent être alignés avec la spécification réelle de votre backend
          HCS-U7.
        </p>
      </section>

      {/* Section 2 : Configuration de la clé API */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Configuration de la clé API</h2>
        <p className="text-sm text-slate-700">
          Après avoir créé une clé dans le dashboard HCS-U7, copiez-la
          immédiatement dans un gestionnaire de secrets (ex : variables
          d'environnement de votre plateforme) et ne l'affichez plus jamais en
          clair.
        </p>
        <p className="text-sm text-slate-700">
          Exemple de configuration dans un fichier <code>.env</code> de votre
          backend (non commité) :
        </p>
        <CodeBlock>{`# .env (exemple) - NE PAS COMMITER
HCS_U7_API_KEY=YOUR_HCS_U7_API_KEY`}</CodeBlock>
        <p className="text-xs text-slate-500">
          Remplacez <code className="font-mono">YOUR_HCS_U7_API_KEY</code> par
          la valeur réelle fournie par le dashboard, uniquement dans votre
          environnement d'exécution (preview, production, etc.).
        </p>
      </section>

      {/* Section 3 : Exemple curl */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Exemple avec curl</h2>
        <p className="text-sm text-slate-700">
          Exemple d'appel HTTP pour vérifier un code HCS-U7 via curl. Adaptez
          l'URL et le payload à votre implémentation réelle.
        </p>
        <CodeBlock>{`curl -X POST https://api.hcs-u7.example.com/v1/verify \
  -H "Authorization: Bearer YOUR_HCS_U7_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "HCSU7-EXEMPLE-1234",
    "context": {
      "userId": "user_123",
      "sessionId": "sess_abc"
    }
  }'`}</CodeBlock>
      </section>

      {/* Section 4 : Exemple Node.js */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Exemple Node.js (TypeScript)</h2>
        <p className="text-sm text-slate-700">
          Exemple d'utilisation dans un backend Node.js / TypeScript avec
          <code className="font-mono">fetch</code>. La clé est lue depuis
          <code className="font-mono">process.env.HCS_U7_API_KEY</code>.
        </p>
        <CodeBlock>{`const API_BASE_URL = "https://api.hcs-u7.example.com";
const API_KEY = process.env.HCS_U7_API_KEY as string;

if (!API_KEY) {
  throw new Error("HCS_U7_API_KEY is not set (configure your environment)");
}

interface VerifyResponse {
  valid: boolean;
  reason?: string;
  // Ajoutez ici les autres champs définis par votre backend.
}

export async function verifyHcsU7Code(code: string): Promise<VerifyResponse> {
  const res = await fetch(API_BASE_URL + "/v1/verify", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code: code,
      context: {
        // Contexte optionnel envoyé à votre backend (ex : id utilisateur)
        userId: "user_123",
      },
    }),
  });

  if (!res.ok) {
    throw new Error(
      "HCS-U7 API error: " + res.status + " " + res.statusText
    );
  }

  const data = (await res.json()) as VerifyResponse;
  return data;
}`}</CodeBlock>
      </section>

      {/* Section 5 : Exemple Python */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Exemple Python</h2>
        <p className="text-sm text-slate-700">
          Exemple d'utilisation avec <code className="font-mono">requests</code>
          en Python. La clé est lue depuis la variable d'environnement
          <code className="font-mono">HCS_U7_API_KEY</code>.
        </p>
        <CodeBlock>{`import os
import requests

API_BASE_URL = "https://api.hcs-u7.example.com"
API_KEY = os.environ.get("HCS_U7_API_KEY")

if API_KEY is None:
    raise RuntimeError("HCS_U7_API_KEY is not set (configure your environment)")


def verify_hcs_u7_code(code: str) -> dict:
    url = API_BASE_URL + "/v1/verify"
    headers = {
        "Authorization": "Bearer " + API_KEY,
        "Content-Type": "application/json",
    }
    payload = {
        "code": code,
        "context": {
            # Contexte optionnel envoyé à votre backend (ex : id utilisateur)
            "userId": "user_123",
        },
    }

    response = requests.post(url, json=payload, headers=headers, timeout=10)
    response.raise_for_status()
    return response.json()`}</CodeBlock>
      </section>

      {/* Section 6 : Exemple Go */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Exemple Go</h2>
        <p className="text-sm text-slate-700">
          Exemple d'utilisation dans un backend Go, avec la clé lue depuis la
          variable d'environnement <code className="font-mono">HCS_U7_API_KEY</code>.
        </p>
        <CodeBlock>{`package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
    "time"
)

const apiBaseURL = "https://api.hcs-u7.example.com"

type VerifyResponse struct {
    Valid  bool   // json:"valid"
    Reason string // json:"reason,omitempty"
    // Ajoutez ici les autres champs définis par votre backend.
}

func verifyHcsU7Code(code string) (*VerifyResponse, error) {
    apiKey := os.Getenv("HCS_U7_API_KEY")
    if apiKey == "" {
        return nil, fmt.Errorf("HCS_U7_API_KEY is not set (configure your environment)")
    }

    payload := map[string]any{
        "code": code,
        "context": map[string]any{
            "userId": "user_123",
        },
    }

    body, err := json.Marshal(payload)
    if err != nil {
        return nil, err
    }

    req, err := http.NewRequest("POST", apiBaseURL+"/v1/verify", bytes.NewBuffer(body))
    if err != nil {
        return nil, err
    }

    req.Header.Set("Authorization", "Bearer "+apiKey)
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{Timeout: 10 * time.Second}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    if resp.StatusCode < 200 || resp.StatusCode >= 300 {
        return nil, fmt.Errorf("HCS-U7 API error: %s", resp.Status)
    }

    var result VerifyResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }

    return &result, nil
}`}</CodeBlock>
      </section>

      {/* Section 7 : Exemple PHP */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">7. Exemple PHP</h2>
        <p className="text-sm text-slate-700">
          Exemple d'utilisation en PHP avec cURL. La clé est lue depuis
          <code className="font-mono">getenv('HCS_U7_API_KEY')</code>.
        </p>
        <CodeBlock>{`<?php

$apiBaseUrl = 'https://api.hcs-u7.example.com';
$apiKey = getenv('HCS_U7_API_KEY');

if ($apiKey === false || $apiKey === '') {
    throw new RuntimeException('HCS_U7_API_KEY is not set (configure your environment)');
}

function verify_hcs_u7_code(string $code): array {
    global $apiBaseUrl, $apiKey;

    $url = $apiBaseUrl . '/v1/verify';
    $payload = [
        'code' => $code,
        'context' => [
            // Contexte optionnel envoyé à votre backend (ex : id utilisateur)
            'userId' => 'user_123',
        ],
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
    ]);

    $responseBody = curl_exec($ch);
    if ($responseBody === false) {
        throw new RuntimeException('HTTP request failed: ' . curl_error($ch));
    }

    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($statusCode < 200 || $statusCode >= 300) {
        throw new RuntimeException('HCS-U7 API error: HTTP ' . $statusCode);
    }

    return json_decode($responseBody, true);
}`}</CodeBlock>
      </section>

      {/* Section 8 : Exemple Java */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">8. Exemple Java (HttpClient)</h2>
        <p className="text-sm text-slate-700">
          Exemple d'utilisation en Java avec
          <code className="font-mono">java.net.http.HttpClient</code>. La clé est
          lue depuis <code className="font-mono">System.getenv("HCS_U7_API_KEY")</code>.
        </p>
        <CodeBlock>{`import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class HcsU7Client {

    private static final String API_BASE_URL = "https://api.hcs-u7.example.com";

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final String apiKey;

    public HcsU7Client() {
        this.apiKey = System.getenv("HCS_U7_API_KEY");
        if (this.apiKey == null || this.apiKey.isEmpty()) {
            throw new IllegalStateException("HCS_U7_API_KEY is not set (configure your environment)");
        }
    }

    public String verifyHcsU7Code(String code) throws Exception {
        String url = API_BASE_URL + "/v1/verify";

        String jsonBody = "{" +
            "\"code\": \"" + code + "\"," +
            "\"context\": {\"userId\": \"user_123\"}" +
            "}";

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Authorization", "Bearer " + apiKey)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        int statusCode = response.statusCode();
        if (statusCode < 200 || statusCode >= 300) {
            throw new RuntimeException("HCS-U7 API error: HTTP " + statusCode);
        }

        return response.body();
    }
}`}</CodeBlock>
      </section>

      {/* Section 6 : Bonnes pratiques */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Bonnes pratiques</h2>
        <ul className="list-disc pl-5 text-sm text-slate-700">
          <li>
            Ne jamais exposer la clé HCS-U7 dans un frontend (React, Mobile,
            SPA, etc.). Les appels doivent toujours passer par votre backend.
          </li>
          <li>
            Limiter la clé aux environnements nécessaires (test, staging,
            production) et la révoquer immédiatement en cas de fuite.
          </li>
          <li>
            Consulter les pages <span className="font-medium">Usage</span>,
            <span className="font-medium">Billing</span> et
            <span className="font-medium">Security</span> du dashboard admin
            pour suivre la consommation et détecter d'éventuels abus.
          </li>
        </ul>
        <p className="text-xs text-slate-500">
          Cette page ne contient volontairement aucun secret ni logique
          cryptographique. Elle sert uniquement de gabarit de documentation.
        </p>
      </section>
    </div>
  );
}
