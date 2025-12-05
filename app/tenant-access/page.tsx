import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function TenantAccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl">
        <Alert className="mb-6">
          <AlertDescription className="text-lg">
            <h1 className="text-2xl font-bold mb-4">🔒 Accès Réservé aux Administrateurs</h1>
            
            <div className="space-y-4">
              <p>
                Ce dashboard est <strong>exclusivement réservé aux administrateurs</strong> HCS-U7.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h2 className="font-semibold mb-2">📱 Pour les Clients (Tenants)</h2>
                <p className="mb-2">
                  L'accès client se fait sur votre espace dédié :
                </p>
                <a 
                  href="https://hcs-u7.online" 
                  className="text-blue-600 hover:underline font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://hcs-u7.online
                </a>
                <p className="mt-2 text-sm text-gray-600">
                  Vous aurez besoin de :
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                  <li>Votre email</li>
                  <li>Votre mot de passe</li>
                  <li>Votre code HCS-U7 (authentification cognitive 2FA)</li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h2 className="font-semibold mb-2">⚠️ Important</h2>
                <p className="text-sm">
                  Pour des raisons de sécurité, les clients ne peuvent pas et ne doivent jamais 
                  pouvoir accéder au dashboard d'administration. Cela protège :
                </p>
                <ul className="list-disc list-inside text-sm mt-1">
                  <li>Les données de tous les clients</li>
                  <li>Les configurations système</li>
                  <li>Les informations financières</li>
                  <li>Les clés API et secrets</li>
                </ul>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button variant="outline">
              Connexion Admin
            </Button>
          </Link>
          <a 
            href="https://hcs-u7.online" 
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button>
              Aller sur l'Espace Client →
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
