'use client';

import { SelectField } from './SelectField';
import { PUBLICOS, setoresDoPublico, type PublicoId } from '@/lib/constants/setores';

// =============================================================================
// Par de campos PÚBLICO + SETOR — usado em TODO formulário do site que cria
// lead de cliente (contato, seletor de modelo, custo de parada).
//
// Por que componente e não copiar em cada tela: é justamente a duplicação que
// causou o problema original — cada formulário tinha a sua lista de segmento em
// texto livre e nenhuma casava com a etiqueta do CRM. Com um lugar só, a
// taxonomia não tem como divergir de novo.
//
// Não entra no formulário de REPRESENTANTE: ali o lead é candidato a
// representante, não cliente — vai pro funil de Reps e não tem público/setor.
// =============================================================================

type Props = {
  publico: PublicoId | '';
  setor: string;
  onPublicoChange: (p: PublicoId | '') => void;
  onSetorChange: (slug: string) => void;
  /** Prefixo dos ids, pra não colidir quando há mais de um form na página. */
  idPrefix: string;
  required?: boolean;
  erroPublico?: string;
  erroSetor?: string;
};

export function PublicoSetorFields({
  publico,
  setor,
  onPublicoChange,
  onSetorChange,
  idPrefix,
  required = true,
  erroPublico,
  erroSetor,
}: Props) {
  return (
    <>
      <SelectField
        id={`${idPrefix}-publico`}
        label="Você está buscando proteção para"
        name="publico"
        required={required}
        placeholder="Selecione"
        value={publico}
        onChange={(e) => {
          onPublicoChange(e.target.value as PublicoId | '');
          onSetorChange(''); // trocar de público invalida o setor escolhido
        }}
        options={PUBLICOS.map((p) => ({ value: p.id, label: `${p.label} — ${p.descricao}` }))}
        error={erroPublico}
      />
      {publico && (
        <SelectField
          id={`${idPrefix}-setor`}
          label="Ramo de atividade"
          name="setor"
          required={required}
          placeholder="Selecione"
          value={setor}
          onChange={(e) => onSetorChange(e.target.value)}
          options={setoresDoPublico(publico).map((s) => ({ value: s.slug, label: s.label }))}
          hint="Não achou o seu? Escolha “Outros” — a gente registra e inclui na lista."
          error={erroSetor}
        />
      )}
    </>
  );
}
