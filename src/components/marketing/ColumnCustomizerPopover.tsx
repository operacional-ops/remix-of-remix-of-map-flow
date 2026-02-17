import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings } from 'lucide-react';

interface ColumnCustomizerPopoverProps {
  columns: { key: string; label: string }[];
  hiddenColumns: string[];
  onHiddenColumnsChange: (hidden: string[]) => void;
}

export default function ColumnCustomizerPopover({ columns, hiddenColumns, onHiddenColumnsChange }: ColumnCustomizerPopoverProps) {
  const toggleColumn = (key: string) => {
    if (hiddenColumns.includes(key)) {
      onHiddenColumnsChange(hiddenColumns.filter(k => k !== key));
    } else {
      onHiddenColumnsChange([...hiddenColumns, key]);
    }
  };

  // Don't allow hiding checkbox, status, or name
  const toggleableColumns = columns.filter(c => !['checkbox', 'status', 'name'].includes(c.key));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-1.5 rounded hover:bg-muted text-muted-foreground" title="Personalizar colunas">
          <Settings className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <p className="text-xs font-semibold text-foreground mb-2">Personalizar Colunas</p>
        <p className="text-[10px] text-muted-foreground mb-3">Escolha como visualizar as colunas na tabela.</p>
        <div className="space-y-2">
          {toggleableColumns.map(col => (
            <label key={col.key} className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
              <Checkbox
                checked={!hiddenColumns.includes(col.key)}
                onCheckedChange={() => toggleColumn(col.key)}
                className="h-3.5 w-3.5"
              />
              {col.label.replace(' ⓘ', '')}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
