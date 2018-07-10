#!/bin/bash

function commonHelpMessage() {
  echo "Usage: $0 [-f stack-file][-h]" >&2
  echo "  stack-file : The CloudFormation template file" >&2
}


function parseCommonArguments() {
  if [ $# -eq 0 ];
  then
      commonHelpMessage
      exit 0
  fi

  while getopts ":f:s:h" opt; do
    case "$opt" in
      h)
        commonHelpMessage
        exit 0
        ;;
      f)
        echo "CloudFormation template $OPTARG";CF_TEMPLATE="$OPTARG"
        ;;
      s)
        echo "CloudFormation stack name $OPTARG";STACK_NAME="$OPTARG"
        ;;
      \?)
        echo "Invalid Option -$OPTARG" >&2
        commonHelpMessage
        exit 1
        ;;
      :)
        echo "Option -$OPTARG requires an argument" >&2
        exit 1
        ;;
      [?])
        commonHelpMessage
        exit 1
        ;;

    esac
  done

  if [ "$CF_TEMPLATE" = "0" ]; then
    echo "CloudFormation template parameter is missing"
    echo
    commonHelpMessage
    exit 1
  fi

  if [ "$STACK_NAME" == "" ]; then
    echo "CloudFormation stack name parameter is missing"
    echo
    commonHelpMessage
    exit 1
  fi
}

parseCommonArguments "$@"

template=$(cat $CF_TEMPLATE)

aws cloudformation describe-stacks --stack-name $STACK_NAME >/dev/null 2>&1

EXISTS=$?

if [ $EXISTS -eq 0 ]; then
  echo "Stack exists"
  echo "Updating $STACK_NAME stack from $CF_TEMPLATE template"
  aws cloudformation update-stack --stack-name $STACK_NAME --template-body "$template" --parameters ParameterKey=VPCCIDRROOT,ParameterValue=10.1 
  UPDATING=$?
  if [ $UPDATING -eq 0 ]; then
    echo "Performing stack update"
  else
    echo "No updates needed. Stack or parameters may not have changed"
    exit 0
  fi
  aws cloudformation wait stack-update-complete --stack-name $STACK_NAME

  SUCCESS=$?

  if [ $SUCCESS -eq 255 ]; then
    echo "$STACK_NAME failed to update"
    exit 1
  else
    echo "$STACK_NAME updated successfully"
  fi
else
  echo "Stack does not exist"
  echo "Creating $STACK_NAME stack from $CF_TEMPLATE template"
  aws cloudformation create-stack --stack-name $STACK_NAME --template-body "$template" --parameters ParameterKey=VPCCIDRROOT,ParameterValue=10.1

  aws cloudformation wait stack-create-complete --stack-name $STACK_NAME

  SUCCESS=$?

  if [ $SUCCESS -eq 255 ]; then
    echo "$STACK_NAME failed to create"
    exit 1
  else
    echo "$STACK_NAME created successfully"
  fi

fi
