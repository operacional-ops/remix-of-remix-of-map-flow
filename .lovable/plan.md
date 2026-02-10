

# Corrigir Concatenacao de Nome do Space com Template

## Problema

Ao criar um Space usando template, o nome do template e o nome digitado pelo usuario sao concatenados **sem separador**, gerando nomes como:

`Template de SpaceEMPRESA DE TEMPLATE`

Em vez de algo como:

`Template de Space | EMPRESA DE TEMPLATE`  
ou simplesmente usar apenas o nome digitado pelo usuario.

## Causa

No arquivo `CreateSpaceDialog.tsx`, linha 79:

```typescript
const finalSpaceName = `${selectedTemplate.name}${spaceName.trim()}`;
```

O comentario no codigo sugere que o template deveria ter um separador (como "MAP | "), mas o template atual se chama apenas "Template de Space" (sem separador).

## Solucao

Duas opcoes possiveis:

**Opcao A (recomendada)**: Adicionar um separador ` | ` entre o nome do template e o nome digitado:

```typescript
const finalSpaceName = `${selectedTemplate.name} | ${spaceName.trim()}`;
```

**Opcao B**: Usar apenas o nome digitado pelo usuario, sem prefixo do template.

## Correcao de Dados

Alem de corrigir o codigo, sera necessario renomear o Space existente no banco de dados para o nome correto.

## Detalhes Tecnicos

- Arquivo: `src/components/spaces/CreateSpaceDialog.tsx`, linha 79
- Tambem atualizar a preview na linha 166 que mostra `{selectedTemplate.name}{spaceName || '[empresa]'}` para incluir o separador
- Corrigir o nome do Space existente via SQL `UPDATE`
