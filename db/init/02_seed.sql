INSERT INTO fundo (id, codigo, nome) VALUES
    (1, 'FDCA', 'Fundo dos Direitos da Criança e do Adolescente'),
    (2, 'FDI',  'Fundo dos Direitos da Pessoa Idosa')
ON CONFLICT (id) DO NOTHING;
