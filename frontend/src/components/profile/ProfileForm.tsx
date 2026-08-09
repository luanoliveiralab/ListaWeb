"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileFormProps {
    nome: string;
    email: string;
    setNome: (value: string) => void;
    setEmail: (value: string) => void;
    onSave: () => void;
}

export default function ProfileForm({
    nome,
    email,
    setNome,
    setEmail,
    onSave,
}: ProfileFormProps) {
    return (
        <Card className="lg:col-span-2">
            <CardContent className="p-8">
                <p className="text-sm font-medium text-primary">Seus dados</p>
                <h2 className="mb-2 mt-1 text-2xl font-semibold tracking-tight">
                    Informações Pessoais
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">Mantenha seu nome e endereço de e-mail atualizados.</p>

                <div className="space-y-6">
                    <div>
                        <Label htmlFor="nome">Nome</Label>

                        <Input
                            id="nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Insira seu nome"
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <Label htmlFor="email">E-mail</Label>

                        <Input
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Insira seu e-mail"
                            className="mt-2"
                        />
                    </div>

                    <Button onClick={onSave} className="w-full sm:w-auto">
                        Salvar Alterações
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
