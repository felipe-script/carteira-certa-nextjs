import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BadgeQuestionMark } from "lucide-react"

export const InfoContribution = () => {
    return (
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Como funciona <BadgeQuestionMark /></CardTitle>
              <CardDescription>
                Preencha os dados e veja a sugestão de aporte por classe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>
                1) Informe <span className="text-foreground">Quanto tenho</span> (o total investido hoje) e o <span className="text-foreground">Novo aporte</span>.
              </div>
              <div>
                2) Para cada classe, preencha o nome e os percentuais <span className="text-foreground">% Ideal</span> e <span className="text-foreground">% Atual</span>.
              </div>
              <div>
                3) Se você não quer aportar em alguma classe agora, marque <span className="text-foreground">Ignorar</span>.
              </div>
              <div>
                4) O app calcula quanto cada classe está <span className="text-foreground">abaixo do ideal</span> após o aporte e sugere o <span className="text-foreground">Quanto aportar</span>.
              </div>
              <div className="pt-2 text-xs">
                Dicas: tente manter os % ideais próximos de 100%. Se não somarem 100%, o sistema normaliza automaticamente e mostra um aviso.
              </div>
            </CardContent>
          </Card>
    )
}