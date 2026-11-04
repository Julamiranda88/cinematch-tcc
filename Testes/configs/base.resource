*** Settings ***
Documentation       Arquivo base do projeto

Library             Browser
Library             ../libs/Participantes.py
Library             ../libs/Catalogo.py
Library             ../libs/ServidorCineMatch.py
Library             Collections
Library             DateTime
Library             String
Library             RequestsLibrary
Library             OperatingSystem

Resource            global_variables.resource
Resource            ../resources/frontEnd/_indexFrontEnd.resource
Resource            ../resources/backEnd/_indexBackEnd.resource
Resource            ../resources/shared/_indexShared.resource
