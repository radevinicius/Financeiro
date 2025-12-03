"""
Script para converter queries SQLite para PostgreSQL
Converte ? para $1, $2, $3, etc. e adiciona RETURNING id onde necessário
"""
import re
import os
from pathlib import Path

def convert_placeholders(content):
    """Converte placeholders ? para $1, $2, $3"""
    def replace_placeholders(match):
        sql = match.group(1)
        count = 0
        def increment(m):
            nonlocal count
            count += 1
            return f'${count}'
        sql = re.sub(r'\?', increment, sql)
        return f"'{sql}'"
    
    # Encontrar todas as strings SQL (entre aspas simples ou backticks)
    content = re.sub(r"'([^']*\?[^']*)'", replace_placeholders, content)
    content = re.sub(r"`([^`]*\?[^`]*)`", lambda m: "`" + replace_placeholders(m).strip("'") + "`", content)
    
    return content

def add_returning_id(content):
    """Adiciona RETURNING id em INSERT statements"""
    # INSERT INTO table (...) VALUES (...) sem RETURNING
    pattern = r'(INSERT INTO \w+\s*\([^)]+\)\s*VALUES\s*\([^)]+\))(?!\s*RETURNING)'
    replacement = r'\1 RETURNING id'
    content = re.sub(pattern, replacement, content, flags=re.IGNORECASE | re.MULTILINE)
    return content

def convert_file(filepath):
    """Converte um arquivo de rotas"""
    print(f"Convertendo: {filepath}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fazer conversões
    content = convert_placeholders(content)
    content = add_returning_id(content)
    
    # Salvar
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Convertido: {filepath}")

def main():
    routes_dir = Path(__file__).parent.parent / 'routes'
    
    # Lista de arquivos de rotas para converter (exceto auth.routes.js que já foi convertido)
    route_files = [
        'usuarios.routes.js',
        'categorias.routes.js',
        'despesas.routes.js',
        'receitas.routes.js',
        'despesas-fixas.routes.js',
        'metas.routes.js',
        'preferencias.routes.js',
        'relatorios.routes.js',
        'admin.routes.js',
        'anexos.routes.js',
        'backup.routes.js',
        'webhook.routes.js'
    ]
    
    for filename in route_files:
        filepath = routes_dir / filename
        if filepath.exists():
            convert_file(filepath)
        else:
            print(f"⚠ Arquivo não encontrado: {filepath}")
    
    print("\n✅ Conversão concluída!")

if __name__ == '__main__':
    main()
