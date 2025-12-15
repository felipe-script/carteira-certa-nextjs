import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
      {/* adicione os creditos para o canal https://www.youtube.com/@investirisforyou pois foi baseada na planilha dele*/}
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Créditos: lógica baseada na planilha do canal{" "}
          <a
            className="underline underline-offset-4 hover:text-foreground"
            href="https://www.youtube.com/@investirisforyou"
            target="_blank"
            rel="noreferrer"
          >

            Investir é pra você
          </a>
          .
        </div>
      </CardFooter>
    </Card>
  )
}